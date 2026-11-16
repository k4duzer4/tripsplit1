import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

export const emptyDatabase = () => ({ users: [], trips: [], pendingRegistrations: [], sessions: [], passwordResets: [] });
const tables = { users: 'users', trips: 'trips', pendingRegistrations: 'pending_registrations', sessions: 'sessions', passwordResets: 'password_resets' };
const recordKey = (collection, row) => collection === 'pendingRegistrations' ? row.email : ['sessions', 'passwordResets'].includes(collection) ? row.tokenHash : row.id;
const scope = new AsyncLocalStorage();
export const database = new Proxy({}, {
  get: (_, key) => scope.getStore().data[key],
  set: (_, key, value) => { scope.getStore().data[key] = value; return true; },
});
export function writeDatabase() { scope.getStore().dirty = true; }
export function queueEmail(message) { scope.getStore().emails.push(message); }

export function createStorage({ connectionString = process.env.DATABASE_URL, dataDir = process.env.TRIPSPLIT_DATA_DIR || path.resolve('.data'), production = process.env.NODE_ENV === 'production', pool: suppliedPool } = {}) {
  if (production && !connectionString && !suppliedPool) throw new Error('DATABASE_URL ausente em produção.');
  const pool = suppliedPool || (connectionString ? new pg.Pool({ connectionString, ssl: { rejectUnauthorized: true }, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000, allowExitOnIdle: true }) : null);
  pool?.on('error', (error) => console.error('Database connection error:', error.code || 'unknown'));
  const dataFile = path.join(dataDir, 'tripsplit.json');
  let queue = Promise.resolve();
  const localLimits = new Map();

  async function readSnapshot(client) {
    const result = await client.query(Object.entries(tables).map(([key, table]) => `SELECT '${key}' AS collection, document FROM tripsplit_private.${table}`).join(' UNION ALL '));
    const data = emptyDatabase();
    for (const row of result.rows) data[row.collection].push(row.document);
    return data;
  }

  async function saveSnapshot(client, before, after) {
    // Insert parents first; delete children first to respect foreign keys.
    for (const [collection, table] of Object.entries(tables)) {
      const previous = new Map(before[collection].map((row) => [recordKey(collection, row), JSON.stringify(row)]));
      for (const row of after[collection]) {
        const key = recordKey(collection, row);
        const serialized = JSON.stringify(row);
        if (previous.get(key) !== serialized) await client.query(`INSERT INTO tripsplit_private.${table} (id, document) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document`, [key, serialized]);
      }
    }
    for (const [collection, table] of Object.entries(tables).reverse()) {
      const remaining = new Set(after[collection].map((row) => recordKey(collection, row)));
      for (const row of before[collection]) if (!remaining.has(recordKey(collection, row))) await client.query(`DELETE FROM tripsplit_private.${table} WHERE id = $1`, [recordKey(collection, row)]);
    }
  }

  return {
    kind: pool ? 'postgres' : 'file',
    async run(mutating, callback) {
      const execute = async () => {
        const client = pool ? await pool.connect() : null;
        try {
          if (client) {
            await client.query(mutating ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
            await client.query("SET LOCAL statement_timeout = '10s'");
            await client.query("SET LOCAL lock_timeout = '5s'");
            if (mutating) await client.query('SELECT pg_advisory_xact_lock(174239, 1)');
          }
          let data;
          if (client) data = await readSnapshot(client);
          else {
            try { data = { ...emptyDatabase(), ...JSON.parse(fs.readFileSync(dataFile, 'utf8')) }; }
            catch (error) { if (error.code !== 'ENOENT') throw error; data = emptyDatabase(); }
          }
          const before = structuredClone(data);
          const context = { data, dirty: false, emails: [] };
          const result = await scope.run(context, callback);
          if (context.dirty && !mutating) throw new Error('Write attempted during read-only request');
          if (context.dirty) {
            if (client) await saveSnapshot(client, before, data);
            else {
              fs.mkdirSync(dataDir, { recursive: true });
              fs.writeFileSync(`${dataFile}.tmp`, JSON.stringify(data, null, 2));
              fs.renameSync(`${dataFile}.tmp`, dataFile);
            }
          }
          if (client) await client.query('COMMIT');
          return { result, emails: context.emails };
        } catch (error) {
          if (client) await client.query('ROLLBACK').catch(() => {});
          throw error;
        } finally { client?.release(); }
      };
      if (pool) return execute();
      const pending = queue.then(execute);
      queue = pending.catch(() => {});
      return pending;
    },
    async limit(key, maximum, windowMs) {
      if (pool) {
        await pool.query('DELETE FROM tripsplit_private.auth_limits WHERE expires_at < now()');
        const result = await pool.query(`INSERT INTO tripsplit_private.auth_limits (id, attempts, expires_at) VALUES ($1, 1, now() + $2::integer * interval '1 millisecond') ON CONFLICT (id) DO UPDATE SET attempts = tripsplit_private.auth_limits.attempts + 1 RETURNING attempts`, [key, windowMs]);
        return result.rows[0].attempts <= maximum;
      }
      const now = Date.now();
      for (const [id, item] of localLimits) if (item.expires <= now) localLimits.delete(id);
      const item = localLimits.get(key) || { attempts: 0, expires: now + windowMs };
      item.attempts += 1;
      localLimits.set(key, item);
      return item.attempts <= maximum;
    },
    async close() { await pool?.end(); },
  };
}

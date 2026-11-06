import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { computeBalances, computePayments, paymentKey } from '../src/lib/settlement.js';

test('encerramento exige acerto completo, autorização e preserva o histórico', { timeout: 20000 }, async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'tripsplit-lifecycle-'));
  const password = 'senha-exclusiva-do-teste';
  const salt = 'test-salt';
  const passwordHash = `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  await writeFile(path.join(dir, 'tripsplit.json'), JSON.stringify({ users: [{ id: 'owner', email: 'owner@example.test', full_name: 'Ana', passwordHash }, { id: 'member', email: 'member@example.test', full_name: 'Bia', passwordHash }], trips: [], sessions: [], pendingRegistrations: [] }));
  const child = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: '0', TRIPSPLIT_DATA_DIR: dir }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => { if (child.exitCode === null) { const stopped = once(child, 'exit'); child.kill(); await stopped; } await rm(dir, { recursive: true, force: true }); });
  const base = await new Promise((resolve, reject) => {
    child.stdout.on('data', (data) => { const match = String(data).match(/http:\/\/localhost:\d+/); if (match) resolve(match[0]); });
    child.once('error', reject); child.once('exit', (code) => reject(new Error(`Servidor saiu com código ${code}`)));
  });
  const call = async (url, method = 'GET', body, token) => {
    const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  };
  const owner = (await call('/api/auth/login', 'POST', { email: 'owner@example.test', password })).body.access_token;
  const member = (await call('/api/auth/login', 'POST', { email: 'member@example.test', password })).body.access_token;
  const trip = (await call('/api/trips', 'POST', { name: 'Viagem de teste' }, owner)).body;
  const route = `/api/trips/${trip.id}`;
  assert.equal((await call(route + '/finish', 'POST', {}, owner)).status, 409);
  const joined = (await call('/api/trips/join', 'POST', { code: trip.inviteCode }, member)).body;
  const ids = joined.participants.map((person) => person.id);
  const expense = { description: 'Jantar', amount: 100, paidBy: ids[0], participantIds: ids };
  const saved = await call(route + '/expenses', 'POST', expense, owner);
  assert.equal(saved.status, 201);
  assert.equal((await call(route + '/finish', 'POST', {}, member)).status, 403);
  assert.equal((await call(route + '/finish', 'POST', {}, owner)).status, 409);
  assert.equal((await call(route + '/payments', 'PATCH', { key: 'inexistente', paid: true }, owner)).status, 400);
  const snapshot = (await call(route, 'GET', null, owner)).body;
  const key = paymentKey(computePayments(computeBalances(snapshot))[0]);
  await call(route + '/payments', 'PATCH', { key, paid: true }, owner);
  await call(route + '/expenses/' + saved.body.id, 'PATCH', { description: 'Jantar atualizado' }, owner);
  assert.equal((await call(route + '/finish', 'POST', {}, owner)).status, 409, 'editar despesa exige uma nova conferência');
  await call(route + '/payments', 'PATCH', { key, paid: true }, owner);
  const closed = await call(route + '/finish', 'POST', {}, owner);
  assert.equal(closed.status, 200);
  assert.equal(closed.body.status, 'finished');
  assert.equal(closed.body.inviteActive, false);
  assert.ok(closed.body.finishedAt);
  assert.equal((await call(route + '/finish', 'POST', {}, owner)).body.finishedAt, closed.body.finishedAt);
  for (const [suffix, method, body] of [['', 'PATCH', { name: 'Não deve alterar' }], ['/participants', 'POST', { name: 'Novo' }], ['/expenses', 'POST', expense], ['/expenses/' + saved.body.id, 'DELETE', null], ['/payments', 'PATCH', { key, paid: false }], ['/invite', 'PATCH', { active: true }]]) {
    assert.equal((await call(route + suffix, method, body, owner)).status, 409);
  }
  assert.equal((await call('/api/trips/join', 'POST', { code: trip.inviteCode }, member)).status, 409);
  assert.equal((await call(route, 'GET', null, member)).body.expenses.length, 1);
  assert.equal(JSON.parse(await readFile(path.join(dir, 'tripsplit.json'), 'utf8')).trips[0].status, 'finished');

  const balanced = (await call('/api/trips', 'POST', { name: 'Sem transferências' }, owner)).body;
  await call(`/api/trips/${balanced.id}/expenses`, 'POST', { ...expense, paidBy: balanced.participants[0].id, participantIds: [balanced.participants[0].id] }, owner);
  assert.equal((await call(`/api/trips/${balanced.id}/finish`, 'POST', {}, owner)).status, 200, 'uma viagem equilibrada pode ser finalizada sem transferências');
});

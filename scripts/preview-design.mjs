// Preview isolado para validar o visual sem alterar .data/tripsplit.json.
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'vite';

const dir = await mkdtemp(path.join(tmpdir(), 'tripsplit-design-'));
const salt = 'visual-preview';
const password = 'TripSplit-visual-2026';
const users = [{ id: 'demo-owner', email: 'visual@exemplo.test', full_name: 'Marina', passwordHash: `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}` }];
const trip = {
  id: 'demo-praia', ownerId: 'demo-owner', status: 'active', name: 'Um fim de semana na praia', startDate: '2026-10-09', endDate: '2026-10-12', currency: 'BRL', inviteCode: 'TRIP-DEMO1', inviteActive: true,
  participants: [{ id: 'marina', userId: 'demo-owner', name: 'Marina', role: 'owner', hasAccount: true, color: '#286950' }, { id: 'bia', name: 'Bia', color: '#dfaa54' }, { id: 'pedro', name: 'Pedro', color: '#628d90' }],
  expenses: [{ id: 'hotel', description: 'Pousada com vista para o mar', amount: 900, paidBy: 'marina', participantIds: ['marina', 'bia', 'pedro'], category: 'Hospedagem', date: '2026-10-09', createdBy: 'demo-owner' }, { id: 'jantar', description: 'Jantar de boas-vindas', amount: 150, paidBy: 'bia', participantIds: ['marina', 'bia', 'pedro'], category: 'Alimentação', date: '2026-10-09', createdBy: 'demo-owner' }], paymentsPaid: {},
};
await writeFile(path.join(dir, 'tripsplit.json'), JSON.stringify({ users, trips: [trip], sessions: [], pendingRegistrations: [] }));
const api = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: '0', TRIPSPLIT_DATA_DIR: dir }, stdio: ['ignore', 'pipe', 'inherit'] });
const url = await new Promise((resolve, reject) => { api.stdout.on('data', (chunk) => { const found = String(chunk).match(/http:\/\/localhost:\d+/); if (found) resolve(found[0]); }); api.once('error', reject); });
const frontend = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true, proxy: { '/api': url } } });
await frontend.listen();
console.log('Preview isolado: http://127.0.0.1:5174 — visual@exemplo.test / TripSplit-visual-2026');
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await frontend.close();
  if (api.exitCode === null) { const stopped = once(api, 'exit'); api.kill(); await stopped; }
  await rm(dir, { recursive: true, force: true });
  process.exit(0);
}
process.on('SIGINT', close);
process.on('SIGTERM', close);

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeBalances, computePayments, paymentKey } from '../src/lib/settlement.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.TRIPSPLIT_DATA_DIR || path.join(__dirname, '..', '.data');
const dataFile = path.join(dataDir, 'tripsplit.json');
const port = Number(process.env.PORT || 3001);
const appUrl = process.env.APP_URL || 'http://localhost:5173';
const sessionTtlMs = Number(process.env.SESSION_TTL_HOURS || 168) * 60 * 60 * 1000;
const verificationTtlMs = Number(process.env.VERIFICATION_TTL_MINUTES || 30) * 60 * 1000;
const resetTtlMs = Number(process.env.RESET_TTL_MINUTES || 30) * 60 * 1000;
const inviteTtlMs = Number(process.env.INVITE_TTL_DAYS || 30) * 24 * 60 * 60 * 1000;
const localVerificationCode = process.env.LOCAL_VERIFICATION_CODE || (process.env.NODE_ENV === 'production' ? null : '123456');

const emptyDatabase = () => ({ users: [], trips: [], pendingRegistrations: [], sessions: [], passwordResets: [] });

function readDatabase() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {
    return emptyDatabase();
  }
}

let database = readDatabase();

function writeDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });
  const tempFile = `${dataFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(database, null, 2));
  fs.renameSync(tempFile, dataFile);
}

function id() {
  return crypto.randomUUID();
}

function secret() {
  return crypto.randomBytes(32).toString('hex');
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function expiresAt(ttlMs) {
  return new Date(Date.now() + ttlMs).toISOString();
}

function isExpired(value) {
  return !value || new Date(value).getTime() <= Date.now();
}

function pruneExpiredAuthRecords() {
  database.sessions = (database.sessions || []).filter((session) => !isExpired(session.expiresAt));
  database.passwordResets = (database.passwordResets || []).filter((reset) => !isExpired(reset.expiresAt));
  database.pendingRegistrations = (database.pendingRegistrations || []).filter((pending) => !isExpired(pending.expiresAt));
}

async function sendEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.info(`[mail:local] ${subject} -> ${to}\n${text}`);
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error('Não foi possível enviar o e-mail.');
}

function inviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TRIP-';
  for (let index = 0; index < 5; index += 1) {
    code += alphabet[crypto.randomInt(alphabet.length)];
  }
  return code;
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Credentials': 'true',
  });
  response.end(JSON.stringify(body));
}

function error(response, status, message) {
  json(response, status, { error: message });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) request.destroy();
    });
    request.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    request.on('error', reject);
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function matchesPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function createSession(userId) {
  pruneExpiredAuthRecords();
  const token = secret();
  database.sessions.push({ tokenHash: digest(token), userId, expiresAt: expiresAt(sessionTtlMs), createdAt: new Date().toISOString() });
  writeDatabase();
  return token;
}

function currentUser(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  pruneExpiredAuthRecords();
  const userId = token && database.sessions?.find((session) => session.tokenHash === digest(token))?.userId;
  return userId ? database.users.find((user) => user.id === userId) : null;
}

function publicUser(user) {
  return { id: user.id, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url || null };
}

function requireUser(request, response) {
  const user = currentUser(request);
  if (!user) {
    error(response, 401, 'Autenticação necessária.');
    return null;
  }
  return user;
}

function visibleTrip(trip, userId) {
  return trip.ownerId === userId || trip.participants.some((participant) => participant.userId === userId);
}

function membership(trip, userId) {
  return trip.participants.find((participant) => participant.userId === userId) || null;
}

function canManageTrip(trip, userId) {
  return trip.ownerId === userId || membership(trip, userId)?.role === 'owner';
}

function findTrip(tripId, userId) {
  const trip = database.trips.find((item) => item.id === tripId);
  return trip && visibleTrip(trip, userId) ? trip : null;
}

function validateExpense(body, trip) {
  const amount = Number(body.amount);
  const participantIds = Array.isArray(body.participantIds) ? body.participantIds : [];
  if (!body.description?.trim()) return 'A descrição é obrigatória.';
  if (!Number.isFinite(amount) || amount <= 0) return 'O valor deve ser maior que zero.';
  if (!body.paidBy || !trip.participants.some((participant) => participant.id === body.paidBy)) return 'O pagador é inválido.';
  if (!participantIds.length || participantIds.some((participantId) => !trip.participants.some((participant) => participant.id === participantId))) {
    return 'Selecione pelo menos um participante válido.';
  }
  return null;
}

function validateTripDates(startDate, endDate) {
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) return 'A data final deve ser posterior à data inicial.';
  return null;
}

async function handle(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    });
    return response.end();
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const body = ['POST', 'PATCH', 'PUT'].includes(request.method) ? await readBody(request) : {};

  if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, { ok: true });
  if (parts[0] === 'api' && parts[1] === 'auth') {
    if (request.method === 'GET' && parts[2] === 'me') {
      const user = currentUser(request);
      return user ? json(response, 200, publicUser(user)) : error(response, 401, 'Não autenticado.');
    }
    if (request.method === 'POST' && parts[2] === 'register') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !email.includes('@') || password.length < 6) return error(response, 400, 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
      if (database.users.some((user) => user.email === email) || database.pendingRegistrations.some((item) => item.email === email)) return error(response, 409, 'Este e-mail já está cadastrado.');
      const code = localVerificationCode || String(crypto.randomInt(100000, 1_000_000));
      database.pendingRegistrations.push({ email, passwordHash: hashPassword(password), code, expiresAt: expiresAt(verificationTtlMs), createdAt: new Date().toISOString() });
      writeDatabase();
      await sendEmail({ to: email, subject: 'Confirme sua conta Trip Split', text: `Seu código de confirmação é ${code}.` });
      return json(response, 201, { pending: true, message: 'Enviamos um código para confirmar o cadastro.' });
    }
    if (request.method === 'POST' && parts[2] === 'verify') {
      const email = String(body.email || '').trim().toLowerCase();
      const pending = database.pendingRegistrations.find((item) => item.email === email && item.code === String(body.otpCode || '') && !isExpired(item.expiresAt));
      if (!pending) return error(response, 400, 'Código inválido ou expirado.');
      const user = { id: id(), email, full_name: email.split('@')[0], passwordHash: pending.passwordHash, createdAt: new Date().toISOString() };
      database.users.push(user);
      database.pendingRegistrations = database.pendingRegistrations.filter((item) => item !== pending);
      writeDatabase();
      return json(response, 201, { access_token: createSession(user.id), user: publicUser(user) });
    }
    if (request.method === 'POST' && parts[2] === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const user = database.users.find((item) => item.email === email);
      if (!user || !matchesPassword(String(body.password || ''), user.passwordHash)) return error(response, 401, 'E-mail ou senha inválidos.');
      return json(response, 200, { access_token: createSession(user.id), user: publicUser(user) });
    }
    if (request.method === 'POST' && parts[2] === 'logout') {
      const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (token) database.sessions = (database.sessions || []).filter((session) => session.tokenHash !== digest(token));
      writeDatabase();
      return json(response, 204, {});
    }
    if (request.method === 'POST' && parts[2] === 'resend') {
      const email = String(body.email || '').trim().toLowerCase();
      const pending = database.pendingRegistrations.find((item) => item.email === email);
      if (pending) {
        pending.code = localVerificationCode || String(crypto.randomInt(100000, 1_000_000));
        pending.expiresAt = expiresAt(verificationTtlMs);
        writeDatabase();
        await sendEmail({ to: email, subject: 'Novo código Trip Split', text: `Seu código de confirmação é ${pending.code}.` });
      }
      return json(response, 200, { ok: true });
    }
    if (request.method === 'POST' && parts[2] === 'reset-request') {
      const email = String(body.email || '').trim().toLowerCase();
      const user = database.users.find((item) => item.email === email);
      if (user) {
        const token = secret();
        database.passwordResets = (database.passwordResets || []).filter((reset) => reset.userId !== user.id);
        database.passwordResets.push({ userId: user.id, tokenHash: digest(token), expiresAt: expiresAt(resetTtlMs) });
        writeDatabase();
        await sendEmail({ to: email, subject: 'Redefina sua senha Trip Split', text: `Redefina sua senha: ${appUrl}/reset-password?token=${token}` });
      }
      return json(response, 200, { ok: true });
    }
    if (request.method === 'POST' && parts[2] === 'reset') {
      const token = String(body.resetToken || '');
      const password = String(body.newPassword || '');
      const reset = database.passwordResets?.find((item) => item.tokenHash === digest(token) && !isExpired(item.expiresAt));
      if (!reset || password.length < 8) return error(response, 400, 'Link inválido ou senha com menos de 8 caracteres.');
      const user = database.users.find((item) => item.id === reset.userId);
      if (!user) return error(response, 400, 'Link inválido.');
      user.passwordHash = hashPassword(password);
      database.passwordResets = database.passwordResets.filter((item) => item !== reset);
      database.sessions = (database.sessions || []).filter((item) => item.userId !== user.id);
      writeDatabase();
      return json(response, 200, { ok: true });
    }
  }

  const user = requireUser(request, response);
  if (!user) return;

  if (parts[0] === 'api' && parts[1] === 'trips' && parts.length === 2) {
    if (request.method === 'GET') return json(response, 200, database.trips.filter((trip) => visibleTrip(trip, user.id)));
    if (request.method === 'POST') {
      const name = String(body.name || '').trim();
      if (!name) return error(response, 400, 'O nome da viagem é obrigatório.');
      const dateError = validateTripDates(body.startDate, body.endDate);
      if (dateError) return error(response, 400, dateError);
      const trip = {
        id: id(), status: 'active', ownerId: user.id, name, startDate: body.startDate || '', endDate: body.endDate || '', currency: body.currency || 'BRL',
        inviteCode: inviteCode(), inviteActive: true, inviteExpiresAt: expiresAt(inviteTtlMs), createdAt: new Date().toISOString(),
        participants: [{ id: id(), userId: user.id, name: user.full_name || user.email, email: user.email, hasAccount: true, role: 'owner', color: null }], expenses: [], paymentsPaid: {},
      };
      database.trips.push(trip);
      writeDatabase();
      return json(response, 201, trip);
    }
  }

  if (parts[0] === 'api' && parts[1] === 'trips' && parts[2] === 'join' && request.method === 'POST') {
    const trip = database.trips.find((item) => item.inviteCode.toUpperCase() === String(body.code || '').trim().toUpperCase());
    if (!trip) return error(response, 404, 'Código de convite não encontrado.');
    if (trip.status === 'finished') return error(response, 409, 'Esta viagem já foi finalizada.');
    if (trip.inviteActive === false || (trip.inviteExpiresAt && isExpired(trip.inviteExpiresAt))) return error(response, 410, 'Este convite expirou ou foi revogado.');
    let participant = trip.participants.find((item) => item.userId === user.id);
    if (!participant) {
      participant = { id: id(), userId: user.id, name: user.full_name || user.email, email: user.email, hasAccount: true, role: 'participant', color: null };
      trip.participants.push(participant);
      writeDatabase();
    }
    return json(response, 200, trip);
  }

  if (parts[0] !== 'api' || parts[1] !== 'trips' || !parts[2]) return error(response, 404, 'Rota não encontrada.');
  const trip = findTrip(parts[2], user.id);
  if (!trip) return error(response, 404, 'Viagem não encontrada.');
  const resource = parts[3];
  const resourceId = parts[4];

  if (resource === 'finish' && request.method === 'POST') {
    if (!canManageTrip(trip, user.id)) return error(response, 403, 'Somente o organizador pode finalizar a viagem.');
    if (trip.status === 'finished') return json(response, 200, trip);
    if (!trip.expenses.length) return error(response, 409, 'Registre as despesas e confira o acerto antes de finalizar.');
    const payments = computePayments(computeBalances(trip));
    if (payments.some((payment) => !trip.paymentsPaid?.[paymentKey(payment)])) {
      return error(response, 409, 'Confirme todos os pagamentos antes de finalizar a viagem.');
    }
    trip.status = 'finished';
    trip.finishedAt = new Date().toISOString();
    trip.finishedBy = user.id;
    trip.inviteActive = false;
    writeDatabase();
    return json(response, 200, trip);
  }

  if (trip.status === 'finished' && request.method !== 'GET' && !(request.method === 'DELETE' && !resource)) {
    return error(response, 409, 'Viagem finalizada. Os registros estão disponíveis apenas para consulta.');
  }

  if (!resource && request.method === 'GET') return json(response, 200, trip);
  if (!resource && request.method === 'PATCH') {
    if (!canManageTrip(trip, user.id)) return error(response, 403, 'Apenas o organizador pode alterar a viagem.');
    const dateError = validateTripDates(body.startDate ?? trip.startDate, body.endDate ?? trip.endDate);
    if (dateError) return error(response, 400, dateError);
    Object.assign(trip, { name: body.name ?? trip.name, startDate: body.startDate ?? trip.startDate, endDate: body.endDate ?? trip.endDate, currency: body.currency ?? trip.currency });
    writeDatabase();
    return json(response, 200, trip);
  }
  if (!resource && request.method === 'DELETE') {
    if (!canManageTrip(trip, user.id)) return error(response, 403, 'Apenas o organizador pode excluir a viagem.');
    database.trips = database.trips.filter((item) => item !== trip);
    writeDatabase();
    return json(response, 204, {});
  }

  if (resource === 'invite' && request.method === 'PATCH') {
    if (!canManageTrip(trip, user.id)) return error(response, 403, 'Apenas o organizador pode gerenciar o convite.');
    if (body.regenerate) trip.inviteCode = inviteCode();
    if (typeof body.active === 'boolean') trip.inviteActive = body.active;
    if (body.expiresAt === null) trip.inviteExpiresAt = null;
    if (body.expiresAt) trip.inviteExpiresAt = body.expiresAt;
    writeDatabase();
    return json(response, 200, { inviteCode: trip.inviteCode, inviteActive: trip.inviteActive, inviteExpiresAt: trip.inviteExpiresAt });
  }

  if (resource === 'participants') {
    if (request.method === 'POST') {
      if (!canManageTrip(trip, user.id)) return error(response, 403, 'Apenas o organizador pode adicionar participantes.');
      const name = String(body.name || '').trim();
      if (!name) return error(response, 400, 'O nome do participante é obrigatório.');
      const email = String(body.email || '').trim().toLowerCase();
      if (email && trip.participants.some((participant) => participant.email === email)) return error(response, 409, 'Este e-mail já participa da viagem.');
      const account = database.users.find((item) => item.email === email);
      const participant = { id: id(), userId: account?.id || null, name, email, hasAccount: Boolean(account), role: 'guest', color: null };
      trip.participants.push(participant);
      writeDatabase();
      return json(response, 201, participant);
    }
    if (request.method === 'DELETE' && resourceId) {
      if (!canManageTrip(trip, user.id)) return error(response, 403, 'Apenas o organizador pode remover participantes.');
      if (trip.participants.find((participant) => participant.id === resourceId)?.userId === trip.ownerId) return error(response, 409, 'O organizador precisa permanecer na viagem.');
      const used = trip.expenses.some((expense) => expense.paidBy === resourceId || expense.participantIds.includes(resourceId));
      if (used) return error(response, 409, 'Remova ou edite as despesas deste participante antes de removê-lo.');
      trip.participants = trip.participants.filter((participant) => participant.id !== resourceId);
      writeDatabase();
      return json(response, 204, {});
    }
  }

  if (resource === 'expenses') {
    if (request.method === 'POST') {
      const validation = validateExpense(body, trip);
      if (validation) return error(response, 400, validation);
      const expense = { id: id(), description: body.description.trim(), amount: Number(body.amount), paidBy: body.paidBy, participantIds: body.participantIds, date: body.date || '', category: body.category || 'Outros', createdBy: user.id, createdAt: new Date().toISOString() };
      trip.expenses.unshift(expense);
      trip.paymentsPaid = {};
      writeDatabase();
      return json(response, 201, expense);
    }
    const expense = trip.expenses.find((item) => item.id === resourceId);
    if (!expense) return error(response, 404, 'Despesa não encontrada.');
    if (request.method === 'PATCH') {
      if (!canManageTrip(trip, user.id) && expense.createdBy !== user.id) return error(response, 403, 'Você só pode editar suas próprias despesas.');
      const candidate = { ...expense, ...body };
      const validation = validateExpense(candidate, trip);
      if (validation) return error(response, 400, validation);
      Object.assign(expense, { description: candidate.description.trim(), amount: Number(candidate.amount), paidBy: candidate.paidBy, participantIds: candidate.participantIds, date: candidate.date || '', category: candidate.category || 'Outros' });
      trip.paymentsPaid = {};
      writeDatabase();
      return json(response, 200, expense);
    }
    if (request.method === 'DELETE') {
      if (!canManageTrip(trip, user.id) && expense.createdBy !== user.id) return error(response, 403, 'Você só pode excluir suas próprias despesas.');
      trip.expenses = trip.expenses.filter((item) => item !== expense);
      trip.paymentsPaid = {};
      writeDatabase();
      return json(response, 204, {});
    }
  }

  if (resource === 'payments' && request.method === 'PATCH') {
    if (!membership(trip, user.id) && !canManageTrip(trip, user.id)) return error(response, 403, 'Apenas participantes podem confirmar pagamentos.');
    if (!body.key) return error(response, 400, 'A chave do pagamento é obrigatória.');
    const validPayments = computePayments(computeBalances(trip));
    if (!validPayments.some((payment) => paymentKey(payment) === body.key)) return error(response, 400, 'Este pagamento não pertence ao acerto atual.');
    trip.paymentsPaid ||= {};
    trip.paymentsPaid[body.key] = Boolean(body.paid);
    writeDatabase();
    return json(response, 200, trip.paymentsPaid);
  }

  return error(response, 404, 'Rota não encontrada.');
}

const server = http.createServer((request, response) => {
  handle(request, response).catch((requestError) => {
    console.error(requestError);
    if (!response.headersSent) error(response, 500, 'Erro interno do servidor.');
  });
});

server.listen(port, () => {
  console.log(`Trip Split API running at http://localhost:${server.address().port}`);
});

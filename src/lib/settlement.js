import { toCents } from './format.js';

export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'TRIP-' + s;
}

// Returns { [participantId]: { paid, consumed } } in cents
export function computePaidAndConsumed(trip) {
  const map = {};
  trip.participants.forEach((p) => { map[p.id] = { paid: 0, consumed: 0 }; });
  trip.expenses.forEach((e) => {
    const totalCents = toCents(e.amount);
    const n = e.participantIds.length;
    if (map[e.paidBy]) map[e.paidBy].paid += totalCents;
    if (n > 0) {
      const base = Math.floor(totalCents / n);
      const remainder = totalCents - base * n;
      e.participantIds.forEach((pid, i) => {
        if (map[pid]) map[pid].consumed += base + (i < remainder ? 1 : 0);
      });
    }
  });
  return map;
}

// Returns { [participantId]: balanceCents }  (positive = receives, negative = pays)
export function computeBalances(trip) {
  const pc = computePaidAndConsumed(trip);
  const balances = {};
  trip.participants.forEach((p) => {
    balances[p.id] = (pc[p.id]?.paid || 0) - (pc[p.id]?.consumed || 0);
  });
  return balances;
}

// Greedy min-transfer settlement. Returns [{ from, to, amount }] in cents
export function computePayments(balances) {
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([id, bal]) => {
    if (bal > 0) creditors.push({ id, amount: bal });
    else if (bal < 0) debtors.push({ id, amount: -bal });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const payments = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0) payments.push({ from: debtors[i].id, to: creditors[j].id, amount: pay });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }
  return payments;
}

export const paymentKey = (p) => `${p.from}::${p.to}::${p.amount}`;

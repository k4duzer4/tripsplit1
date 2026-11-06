import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances, computePayments } from '../src/lib/settlement.js';

test('calcula saldos e minimiza transferências para divisão igual', () => {
  const trip = {
    participants: [{ id: 'ana' }, { id: 'bia' }, { id: 'caio' }],
    expenses: [
      { amount: 90, paidBy: 'ana', participantIds: ['ana', 'bia', 'caio'] },
      { amount: 30, paidBy: 'bia', participantIds: ['ana', 'bia', 'caio'] },
    ],
  };

  const balances = computeBalances(trip);
  assert.deepEqual(balances, { ana: 5000, bia: -1000, caio: -4000 });
  assert.deepEqual(computePayments(balances), [
    { from: 'caio', to: 'ana', amount: 4000 },
    { from: 'bia', to: 'ana', amount: 1000 },
  ]);
});

test('distribui centavos sem perder valor', () => {
  const trip = {
    participants: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    expenses: [{ amount: 10, paidBy: 'a', participantIds: ['a', 'b', 'c'] }],
  };

  const balances = computeBalances(trip);
  assert.equal(Object.values(balances).reduce((total, value) => total + value, 0), 0);
  assert.equal(computePayments(balances).reduce((total, payment) => total + payment.amount, 0), 666);
});

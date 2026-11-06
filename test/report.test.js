import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildReportData, buildReportText, buildReportPDF } from '../src/lib/exportReport.js';
import { paymentKey } from '../src/lib/settlement.js';

const fonts = ['Regular', 'Bold'].map((weight) => fs.readFileSync(`public/fonts/NotoSans-${weight}.ttf`).toString('base64'));
const trip = { name: 'Viagem de José', currency: 'EUR', status: 'active', participants: [{ id: 'a', name: 'José' }, { id: 'b', name: 'María' }, { id: 'c', name: 'Luís' }], expenses: [{ description: 'Café', amount: 10, date: '2026-10-09', category: 'Alimentação', paidBy: 'a', participantIds: ['a', 'b', 'c'] }], paymentsPaid: {} };

test('relatórios preservam centavos e descontam pagamentos confirmados', () => {
  const report = buildReportData(trip);
  assert.deepEqual(report.expenses[0].shares.map((share) => share.cents), [334, 333, 333]);
  assert.equal(report.participants.reduce((sum, p) => sum + p.consumed, 0), report.total);
  const finished = { ...trip, status: 'finished', paymentsPaid: Object.fromEntries(report.payments.map((p) => [paymentKey(p), true])) };
  assert.ok(buildReportData(finished).participants.every((p) => p.outstanding === 0));
  const text = buildReportText(finished, { language: 'en', locale: 'en-US' });
  assert.ok(text.includes('Trip finished'));
  assert.ok(text.includes('José'));
  assert.ok(text.includes('Exact split'));
  assert.ok(!text.includes('Código de convite'));
  assert.ok(text.indexOf('GROUP SETTLEMENT') < text.indexOf('EXPENSE LEDGER'));
});

test('PDF pagina viagens extensas e células maiores que uma página', async () => {
  const long = { ...trip, name: 'Um roteiro com nomes e descrições longas '.repeat(5), participants: trip.participants.map((p) => ({ ...p, name: p.name + ' de Albuquerque da Silva '.repeat(6) })), expenses: Array.from({ length: 25 }, (_, i) => ({ ...trip.expenses[0], description: `${i + 1}. ` + 'Reserva completa do passeio pelo centro histórico '.repeat(i === 5 ? 160 : 5) })) };
  const doc = await buildReportPDF(long, { fonts, language: 'es', locale: 'es-ES' });
  assert.ok(doc.getNumberOfPages() > 4);
  assert.ok(doc.output('arraybuffer').byteLength > 10000);
});

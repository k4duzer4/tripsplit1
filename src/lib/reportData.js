import { formatMoney, formatDate, toCents } from './format.js';
import { computePaidAndConsumed, computeBalances, computePayments, paymentKey } from './settlement.js';
import { t, language, locale } from './i18n.js';

export function buildReportData(trip, options = {}) {
  const lang = options.language || language;
  const reportLocale = options.locale || locale;
  const tr = (key, params) => t(key, params, lang);
  const money = (cents) => formatMoney(cents, trip.currency || 'BRL', reportLocale);
  const date = (value) => formatDate(value, reportLocale);
  const people = Object.fromEntries(trip.participants.map((person) => [person.id, person]));
  const balances = computeBalances(trip);
  const paidConsumed = computePaidAndConsumed(trip);
  const outstanding = { ...balances };
  const payments = computePayments(balances).map((payment) => {
    const paid = !!trip.paymentsPaid?.[paymentKey(payment)];
    if (paid) { outstanding[payment.from] += payment.amount; outstanding[payment.to] -= payment.amount; }
    return { ...payment, fromName: people[payment.from]?.name || '-', toName: people[payment.to]?.name || '-', paid };
  });
  return {
    trip, tr, money, date,
    generatedAt: (options.generatedAt || new Date()).toLocaleString(reportLocale),
    total: trip.expenses.reduce((sum, expense) => sum + toCents(expense.amount), 0),
    period: [trip.startDate, trip.endDate].filter(Boolean).map(date).join(' - '),
    payments,
    confirmed: payments.filter((payment) => payment.paid).length,
    participants: trip.participants.map((person) => ({
      ...person, ...paidConsumed[person.id], balance: balances[person.id], outstanding: outstanding[person.id],
    })),
    expenses: [...trip.expenses].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((expense) => {
      const cents = toCents(expense.amount);
      const count = expense.participantIds.length;
      const base = count ? Math.floor(cents / count) : 0;
      const remainder = count ? cents % count : 0;
      return {
        ...expense, cents, payer: people[expense.paidBy]?.name || '-',
        shares: expense.participantIds.map((id, index) => ({
          name: people[id]?.name || '-', cents: base + (index < remainder ? 1 : 0),
        })),
      };
    }),
  };
}

export function buildReportText(trip, options = {}) {
  const r = buildReportData(trip, options);
  const { tr, money, date } = r;
  const lines = [];
  const section = (title) => lines.push('', '-'.repeat(60), title.toUpperCase(), '-'.repeat(60));
  const balance = (cents) => cents === 0 ? tr('Quitado') : tr(cents > 0 ? 'Receber' : 'Pagar') + ': ' + money(Math.abs(cents));
  lines.push('tripsplit. / ' + tr('Relatório da viagem'), trip.name);
  if (r.period) lines.push(r.period);
  lines.push(tr('Gerado em {0}', { 0: r.generatedAt }), tr('Situação') + ': ' + tr(trip.status === 'finished' ? 'Viagem finalizada' : 'Em aberto'));
  section(tr('Resumo da viagem'));
  lines.push(tr('Total da viagem') + ': ' + money(r.total), tr('Pessoas') + ': ' + r.participants.length, tr('Despesas') + ': ' + r.expenses.length, tr('Pagamentos confirmados') + ': ' + tr('{0} de {1}', { 0: r.confirmed, 1: r.payments.length }));
  section(tr('Acerto do grupo'));
  if (!r.payments.length) lines.push(tr('Nenhuma transferência necessária.'));
  r.payments.forEach((p, index) => lines.push(index + 1 + '. ' + tr('{0} de {1} para {2}', { 0: money(p.amount), 1: p.fromName, 2: p.toName }) + ' [' + tr(p.paid ? 'Pago' : 'Pendente') + ']'));
  lines.push(tr('Os pagamentos são realizados fora do Trip Split e confirmados pelo grupo.'));
  section(tr('Detalhamento por pessoa'));
  lines.push(tr('Transferências confirmadas já estão descontadas do saldo pendente.'));
  r.participants.forEach((p) => lines.push('', p.name, '  ' + tr('Pago em despesas') + ': ' + money(p.paid), '  ' + tr('Sua parte') + ': ' + money(p.consumed), '  ' + tr('Saldo antes do acerto') + ': ' + balance(p.balance), '  ' + tr('Saldo pendente') + ': ' + balance(p.outstanding)));
  section(tr('Registro de despesas'));
  r.expenses.forEach((e, index) => lines.push('', index + 1 + '. ' + e.description + ' / ' + money(e.cents), '  ' + tr('Categoria') + ': ' + tr(e.category || 'Outros') + ' / ' + tr('Data') + ': ' + (date(e.date) || '-'), '  ' + tr('Pago por') + ': ' + e.payer, '  ' + tr('Divisão exata') + ':', ...e.shares.map((share) => '    ' + share.name + ': ' + money(share.cents))));
  lines.push('', 'tripsplit. / ' + tr('Divida a viagem. Não a amizade.'));
  return lines.join('\n');
}

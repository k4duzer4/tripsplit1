import fs from 'node:fs/promises';
import { buildReportPDF, buildReportText } from '../src/lib/exportReport.js';
const fonts = await Promise.all(['Regular', 'Bold'].map(async (weight) => (await fs.readFile(`public/fonts/NotoSans-${weight}.ttf`)).toString('base64')));
const options = { fonts, language: 'pt', locale: 'pt-BR', generatedAt: new Date('2026-10-09T12:00:00-03:00') };
const trip = {
  name: 'Um fim de semana na praia', status: 'active', currency: 'BRL', startDate: '2026-10-09', endDate: '2026-10-12',
  participants: [{ id: 'a', name: 'Marina' }, { id: 'b', name: 'Bia' }, { id: 'c', name: 'Pedro' }],
  expenses: [{ description: 'Pousada com vista para o mar', amount: 900, paidBy: 'a', participantIds: ['a', 'b', 'c'], category: 'Hospedagem', date: '2026-10-09' }, { description: 'Jantar de boas-vindas', amount: 150, paidBy: 'b', participantIds: ['a', 'b', 'c'], category: 'Alimentação', date: '2026-10-09' }], paymentsPaid: { 'c::a::35000': true },
};
await fs.mkdir('output/pdf', { recursive: true });
await fs.mkdir('tmp/pdfs', { recursive: true });
const sample = await buildReportPDF(trip, options);
await fs.writeFile('output/pdf/tripsplit-exemplo.pdf', new Uint8Array(sample.output('arraybuffer')));
await fs.writeFile('output/pdf/tripsplit-exemplo.txt', buildReportText(trip, options));
const stress = { ...trip, name: 'Um roteiro com nomes e descrições longas '.repeat(5), participants: trip.participants.map((p) => ({ ...p, name: p.name + ' de Albuquerque da Silva '.repeat(6) })), expenses: Array.from({ length: 12 }, (_, i) => ({ ...trip.expenses[i % 2], description: `${i + 1}. ` + 'Reserva completa do passeio pelo centro histórico '.repeat(i === 5 ? 160 : 5) })) };
const long = await buildReportPDF(stress, { ...options, language: 'es', locale: 'es-ES' });
await fs.writeFile('tmp/pdfs/stress.pdf', new Uint8Array(long.output('arraybuffer')));
console.log(`Sample: ${sample.getNumberOfPages()} pages; stress: ${long.getNumberOfPages()} pages`);

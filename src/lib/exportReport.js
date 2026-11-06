import { jsPDF } from 'jspdf';
import { buildReportData } from './reportData.js';
export { buildReportData, buildReportText } from './reportData.js';

const clean = (value) => String(value ?? '-').replace(/[\u00a0\u202f]/g, ' ').replace(/[\u2010-\u2015]/g, '-');

let fontCache;
async function loadFonts() {
  if (!fontCache) fontCache = Promise.all(['Regular', 'Bold'].map(async (weight) => {
    const viteMeta = /** @type {any} */ (import.meta);
    const response = await fetch((viteMeta.env?.BASE_URL || '/') + 'fonts/NotoSans-' + weight + '.ttf');
    if (!response.ok) throw new Error('Report font unavailable');
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  })).catch((error) => { fontCache = null; throw error; });
  return fontCache;
}

export async function buildReportPDF(trip, options = {}) {
  const r = buildReportData(trip, options);
  const { tr, money } = r;
  const fonts = options.fonts || await loadFonts();
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true, putOnlyUsedFonts: true });
  fonts.forEach((font, index) => {
    const file = 'NotoSans-' + index + '.ttf';
    doc.addFileToVFS(file, font);
    doc.addFont(file, 'NotoSans', index ? 'bold' : 'normal');
  });
  doc.setProperties({ title: trip.name + ' - ' + tr('Relatório da viagem'), author: 'Trip Split', subject: tr('Acerto do grupo') });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 40, width = W - 2 * M, bottom = H - 48;
  const C = { green: '#173f34', lime: '#e6f2b3', ink: '#253d35', muted: '#6d7770', line: '#e3e6df', paper: '#f8f7f3', white: '#ffffff' };
  let y = 40;
  const font = (size = 9, bold = false, color = C.ink) => { doc.setFont('NotoSans', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(color); };
  const drawText = (value, x, top, size = 9, bold = false, color = C.ink) => {
    font(size, bold, color); doc.text(clean(value), x, top);
  };
  const wrap = (value, maxWidth, size = 9, bold = false) => {
    font(size, bold); return doc.splitTextToSize(clean(value), maxWidth);
  };
  const newPage = () => {
    doc.addPage(); y = M;
    drawText('tripsplit.', M, y, 12, true, C.green);
    drawText(tr('Relatório da viagem'), W - M - doc.getTextWidth(clean(tr('Relatório da viagem'))), y, 8, false, C.muted);
    y += 22;
  };
  const ensure = (height) => { if (y + height > bottom) newPage(); };
  const paragraph = (value, size = 9, color = C.muted, bold = false, indent = 0) => {
    for (const line of wrap(value, width - indent, size, bold)) {
      ensure(size * 1.5); drawText(line, M + indent, y + size, size, bold, color); y += size * 1.5;
    }
    y += 8;
  };
  const section = (number, title) => {
    ensure(90); y += 10;
    doc.setFillColor(C.lime); doc.roundedRect(M, y, 25, 25, 7, 7, 'F');
    drawText(number, M + 6, y + 17, 10, true, C.green);
    drawText(title, M + 36, y + 17, 14, true, C.green);
    y += 40;
  };
  // Rows can span pages. Each continuation repeats its column headings.
  const table = (headers, widths, rows, boldFirst = true) => {
    const size = 8.5, leading = 13, pad = 9;
    const headerLines = headers.map((value, i) => wrap(value, widths[i] - 2 * pad, 8, true));
    const headerH = Math.max(...headerLines.map((lines) => lines.length)) * 12 + 16;
    const heading = () => {
      doc.setFillColor(C.green); doc.roundedRect(M, y, width, headerH, 5, 5, 'F');
      let x = M;
      headerLines.forEach((lines, i) => { lines.forEach((line, j) => drawText(line, x + pad, y + 14 + j * 12, 8, true, C.white)); x += widths[i]; });
      y += headerH;
    };
    ensure(headerH + 35); heading();
    rows.forEach((row, rowIndex) => {
      const cells = row.map((cell, i) => wrap(cell, widths[i] - 2 * pad, size, i === 0 && boldFirst));
      const length = Math.max(...cells.map((lines) => lines.length));
      let offset = 0;
      if (length * leading + 18 <= bottom - M - headerH - 22 && y + length * leading + 18 > bottom) { newPage(); heading(); }
      while (offset < length) {
        let available = Math.floor((bottom - y - 18) / leading);
        if (available < 1) { newPage(); heading(); available = Math.floor((bottom - y - 18) / leading); }
        const take = Math.min(available, length - offset);
        const height = take * leading + 18;
        doc.setFillColor(rowIndex % 2 ? C.white : C.paper); doc.rect(M, y, width, height, 'F');
        let x = M;
        cells.forEach((lines, i) => {
          lines.slice(offset, offset + take).forEach((line, j) => drawText(line, x + pad, y + 16 + j * leading, size, i === 0 && boldFirst, C.ink));
          x += widths[i];
        });
        doc.setDrawColor(C.line); doc.line(M, y + height, W - M, y + height);
        y += height; offset += take;
        if (offset < length) { newPage(); heading(); }
      }
    });
    y += 15;
  };
  // Cover: a calm travel-journal title, not a dense accounting sheet.
  doc.setFillColor(C.green); doc.roundedRect(M, y, width, 41, 12, 12, 'F');
  drawText('tripsplit.', M + 16, y + 27, 18, true, C.lime);
  font(8, true, C.white);
  doc.text(clean(tr('Relatório da viagem')), W - M - 16, y + 25, { align: 'right' });
  y += 61;
  paragraph(trip.name, 25, C.green, true);
  if (r.period) paragraph(r.period, 10);
  paragraph(tr('Gerado em {0}', { 0: r.generatedAt }), 8);
  paragraph(tr(trip.status === 'finished' ? 'Viagem finalizada' : 'Em aberto'), 10, C.green, true);
  const stats = [[tr('Total da viagem'), money(r.total)], [tr('Pessoas'), String(r.participants.length)], [tr('Despesas'), String(r.expenses.length)]];
  const gap = 10, cardW = (width - 2 * gap) / 3;
  const cardH = Math.max(...stats.map(([label, value]) => wrap(label, cardW - 24, 8).length * 12 + wrap(value, cardW - 24, 14, true).length * 20)) + 26;
  ensure(cardH); stats.forEach(([label, value], i) => {
    const x = M + i * (cardW + gap);
    doc.setFillColor(C.paper); doc.roundedRect(x, y, cardW, cardH, 10, 10, 'F');
    const labels = wrap(label, cardW - 24, 8);
    labels.forEach((line, j) => drawText(line, x + 12, y + 19 + j * 12, 8, false, C.muted));
    wrap(value, cardW - 24, 14, true).forEach((line, j) => drawText(line, x + 12, y + 37 + (labels.length - 1) * 12 + j * 20, 14, true, C.green));
  }); y += cardH + 12;
  section('01', tr('Acerto do grupo'));
  paragraph(tr('Pagamentos confirmados') + ': ' + tr('{0} de {1}', { 0: r.confirmed, 1: r.payments.length }), 10, C.green, true);
  if (!r.payments.length) paragraph(tr('Nenhuma transferência necessária.'), 10, C.green);
  else table([tr('De'), tr('Para'), tr('Valor'), tr('Situação')], [150, 150, 110, width - 410], r.payments.map((p) => [p.fromName, p.toName, money(p.amount), tr(p.paid ? 'Pago' : 'Pendente')]));
  paragraph(tr('Os pagamentos são realizados fora do Trip Split e confirmados pelo grupo.'), 8);
  section('02', tr('Detalhamento por pessoa'));
  paragraph(tr('Transferências confirmadas já estão descontadas do saldo pendente.'), 8);
  const balance = (cents) => cents === 0 ? tr('Quitado') : tr(cents > 0 ? 'Receber' : 'Pagar') + '\n' + money(Math.abs(cents));
  table([tr('Pessoa'), tr('Pago em despesas'), tr('Sua parte'), tr('Saldo antes do acerto'), tr('Saldo pendente')], [151, 90, 90, 90, width - 421], r.participants.map((p) => [p.name, money(p.paid), money(p.consumed), balance(p.balance), balance(p.outstanding)]));
  section('03', tr('Registro de despesas'));
  table([tr('Descrição'), tr('Valor')], [width - 110, 110], r.expenses.map((e, index) => [
    (index + 1) + '. ' + e.description + '\n' + tr(e.category || 'Outros') + ' / ' + (r.date(e.date) || '-') + '\n' + tr('Pago por') + ': ' + e.payer + '\n' + tr('Divisão exata') + ': ' + e.shares.map((share) => share.name + ' (' + money(share.cents) + ')').join('; '), money(e.cents),
  ]), false);
  paragraph(tr('Divida a viagem. Não a amizade.'), 11, C.green, true);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setDrawColor(C.line); doc.line(M, H - 36, W - M, H - 36);
    drawText('tripsplit.', M, H - 22, 8, true, C.green);
    font(8, false, C.muted); doc.text(clean(tr('Página {0} de {1}', { 0: page, 1: pages })), W - M, H - 22, { align: 'right' });
  }
  return doc;
}

export async function createReportPDFBlob(trip) {
  const doc = await buildReportPDF(trip);
  return doc.output('blob');
}

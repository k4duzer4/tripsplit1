import test from 'node:test';
import assert from 'node:assert/strict';
import { openPDFReport, copyReportText } from '../src/lib/reportDelivery.js';

function previewFixture() {
  const events = [];
  const preview = { opener: 'parent', closed: false, document: { title: '', body: { textContent: '', style: {} } }, location: { replace: (url) => events.push(['navigate', url]) }, close() { this.closed = true; events.push(['close']); } };
  let onClose;
  const options = {
    openWindow: () => { events.push(['open']); return preview; },
    createURL: (blob) => { events.push(['blob', blob.type]); return 'blob:report'; },
    revokeURL: (url) => events.push(['revoke', url]),
    watchClose: (callback) => { onClose = callback; return 1; },
    stopWatch: (timer) => events.push(['stop', timer]),
    title: 'Report', loadingMessage: 'Preparing…',
  };
  return { preview, events, options, closeTick: () => onClose() };
}

test('PDF abre a aba antes de gerar e permanece disponível até fechar', async () => {
  const f = previewFixture();
  let complete;
  const pending = openPDFReport(() => new Promise((resolve) => { complete = resolve; f.events.push(['generate']); }), f.options);
  assert.deepEqual(f.events, [['open'], ['generate']]);
  assert.equal(f.preview.opener, null);
  assert.equal(f.preview.document.body.textContent, 'Preparing…');
  complete(new Blob(['%PDF'], { type: 'application/pdf' }));
  await pending;
  assert.ok(f.events.some(([event]) => event === 'navigate'));
  f.closeTick();
  assert.ok(!f.events.some(([event]) => event === 'revoke'));
  f.preview.closed = true; f.closeTick();
  assert.deepEqual(f.events.slice(-2), [['revoke', 'blob:report'], ['stop', 1]]);
});

test('pop-up bloqueado não inicia geração nem download', async () => {
  let generated = false;
  await assert.rejects(openPDFReport(() => { generated = true; }, { openWindow: () => null }), { code: 'POPUP_BLOCKED' });
  assert.equal(generated, false);
});

test('falha ao gerar fecha a aba provisória', async () => {
  const f = previewFixture();
  await assert.rejects(openPDFReport(async () => { throw new Error('font failure'); }, f.options), /font failure/);
  assert.equal(f.preview.closed, true);
});

test('fechar a aba antes da geração não cria um URL sem uso', async () => {
  const f = previewFixture();
  await openPDFReport(async () => { f.preview.closed = true; return new Blob(); }, f.options);
  assert.deepEqual(f.events, [['open']]);
});

test('texto é copiado sem BOM e falhas não são reportadas como sucesso', async () => {
  let copied;
  await copyReportText('Relatório\nJosé: R$ 3,34', { writeText: async (text) => { copied = text; } });
  assert.equal(copied, 'Relatório\nJosé: R$ 3,34');
  await assert.rejects(copyReportText('Report', {}), /Clipboard unavailable/);
  await assert.rejects(copyReportText('Report', { writeText: async () => { throw new Error('denied'); } }), /denied/);
});

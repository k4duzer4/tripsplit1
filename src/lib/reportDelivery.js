// Create the tab in the click event, before any import/font loading, so popup
// blockers do not mistake the async PDF generation for an unsolicited window.
export async function openPDFReport(buildBlob, {
  openWindow = () => window.open('', '_blank'),
  createURL = (blob) => URL.createObjectURL(blob),
  revokeURL = (url) => URL.revokeObjectURL(url),
  watchClose = (callback) => setInterval(callback, 1000),
  stopWatch = (timer) => clearInterval(timer),
  title = 'Trip Split',
  loadingMessage = '',
} = {}) {
  const preview = openWindow();
  if (!preview) throw Object.assign(new Error('Popup blocked'), { code: 'POPUP_BLOCKED' });
  let url;
  try {
    preview.opener = null;
    preview.document.title = title;
    preview.document.body.textContent = loadingMessage;
    Object.assign(preview.document.body.style, { background: '#f8f7f3', color: '#173f34', fontFamily: 'system-ui, sans-serif', padding: '32px' });
    const blob = await buildBlob();
    if (preview.closed) return;
    url = createURL(blob);
    preview.location.replace(url);
    const timer = watchClose(() => {
      if (preview.closed) { revokeURL(url); stopWatch(timer); }
    });
  } catch (error) {
    if (url) revokeURL(url);
    if (!preview.closed) preview.close();
    throw error;
  }
}

export async function copyReportText(text, clipboard = globalThis.navigator?.clipboard) {
  if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
  await clipboard.writeText(text);
}

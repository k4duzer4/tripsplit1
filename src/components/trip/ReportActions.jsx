import { useEffect, useState } from 'react';
import { FileText, Copy, Check, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import PaperPlaneLoader from '@/components/PaperPlaneLoader';
import { t } from '@/lib/i18n';
import { buildReportText } from '@/lib/reportData';
import { copyReportText, openPDFReport } from '@/lib/reportDelivery';

export default function ReportActions({ trip }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [manualText, setManualText] = useState('');
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timer);
  }, [copied]);

  const openPDF = async () => {
    if (busy) return;
    setBusy('pdf'); setError('');
    try {
      await openPDFReport(async () => {
        const reports = await import('@/lib/exportReport');
        return reports.createReportPDFBlob(trip);
      }, { title: t('Relatório da viagem'), loadingMessage: t('Preparando relatório…') });
    } catch (failure) { setError(t(failure?.code === 'POPUP_BLOCKED' ? 'Seu navegador bloqueou a nova aba. Permita pop-ups para este site e tente novamente.' : 'Não foi possível gerar o relatório.')); }
    finally { setBusy(''); }
  };

  const copyText = async () => {
    if (busy) return;
    setBusy('text'); setError(''); setCopied(false);
    let text;
    try {
      text = buildReportText(trip);
      // No async imports here: retain the clipboard permission of this click.
      await copyReportText(text);
      setCopied(true); setManualText('');
    } catch {
      if (text) setManualText(text);
      else setError(t('Não foi possível gerar o relatório.'));
    } finally { setBusy(''); }
  };
  if (!trip.expenses.length) return null;
  return <div>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={!!busy} aria-label={t('Abrir relatório em PDF em uma nova aba')} onClick={openPDF}>{busy === 'pdf' ? <PaperPlaneLoader /> : <FileText />}{t('Abrir PDF')}<ArrowUpRight className="!h-3 !w-3" /></Button>
      <Button size="sm" variant="outline" disabled={!!busy} aria-label={t('Copiar texto do relatório')} onClick={copyText}>{busy === 'text' ? <PaperPlaneLoader /> : copied ? <Check /> : <Copy />}{t(copied ? 'Texto copiado' : 'Copiar texto')}</Button>
    </div>
    {busy && <span role="status" className="sr-only">{t('Preparando relatório…')}</span>}
    {copied && <span role="status" className="sr-only">{t('Texto copiado')}</span>}
    {error && <p role="alert" className="action-error mt-2">{error}</p>}
    <Dialog open={!!manualText} onOpenChange={(open) => !open && setManualText('')}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{t('Copiar texto')}</DialogTitle><DialogDescription>{t('Não foi possível copiar automaticamente. Selecione o texto abaixo e use a opção Copiar do seu dispositivo.')}</DialogDescription></DialogHeader>
        <Textarea readOnly autoFocus aria-label={t('Texto do relatório')} value={manualText} onFocus={(event) => event.target.select()} className="h-72 rounded-2xl font-mono text-xs" />
        <DialogFooter><Button variant="ghost" onClick={() => setManualText('')}>{t('Fechar')}</Button><Button disabled={!!busy} onClick={copyText}><Copy />{t('Copiar texto')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

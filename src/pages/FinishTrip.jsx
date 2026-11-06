import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CheckCircle2, Flag, LockKeyhole, ArrowLeft, Receipt, Users } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useTripStore } from '@/lib/tripStore';
import { computeBalances, computePayments, paymentKey } from '@/lib/settlement';
import { formatMoney, toCents } from '@/lib/format';
import { Button } from '@/components/ui/button';
import PaperPlaneLoader from '@/components/PaperPlaneLoader';
import ReportActions from '@/components/trip/ReportActions';

export default function FinishTrip() {
  const { trip } = /** @type {{ trip: any }} */ (useOutletContext());
  const { user } = useAuth();
  const { finishTrip } = useTripStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const payments = computePayments(computeBalances(trip));
  const confirmed = payments.filter((p) => trip.paymentsPaid?.[paymentKey(p)]).length;
  const finished = trip.status === 'finished';
  const owner = trip.ownerId === user?.id;
  const ready = trip.expenses.length > 0 && confirmed === payments.length;
  const finish = async () => {
    if (saving || !owner || !ready || finished) return;
    setSaving(true); setError('');
    try { await finishTrip(trip.id); }
    catch (failure) { setError(failure.message || t('Não foi possível finalizar a viagem.')); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <Link to={`/viagem/${trip.id}/acerto`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />{t('Voltar ao acerto')}</Link>
    <section className="journey-panel p-7 sm:p-10" aria-labelledby="finish-heading">
      <div className="relative z-10"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#e6f2b3]">{finished ? <CheckCircle2 className="h-7 w-7" /> : <Flag className="h-7 w-7" />}</span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-[#e6f2b3]">{t(finished ? "Tudo em dia" : "Última parada")}</p>
        <h2 id="finish-heading" className="mt-3 text-3xl font-bold sm:text-4xl">{t(finished ? "Viagem finalizada" : "Vamos guardar essa história?")}</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">{finished ? t('Seu registro está guardado. Reviva a viagem, abra o PDF ou copie o relatório quando quiser.') : t('Ao finalizar {0}, o convite será encerrado e despesas e pagamentos ficarão disponíveis apenas para consulta e exportação.', { 0: trip.name })}</p>
      </div>
    </section>
    <section className="surface p-6 sm:p-8" aria-label={t('Resumo da viagem')}>
      <div className="grid gap-5 sm:grid-cols-3"><div><p className="eyebrow">{t('Total da viagem')}</p><p className="mt-2 text-2xl font-bold break-words">{formatMoney(trip.expenses.reduce((sum, e) => sum + toCents(e.amount), 0), trip.currency)}</p></div><div><p className="eyebrow flex items-center gap-2"><Users className="h-4 w-4" />{t('Pessoas')}</p><p className="mt-2 text-2xl font-bold">{trip.participants.length}</p></div><div><p className="eyebrow flex items-center gap-2"><Receipt className="h-4 w-4" />{t('Despesas')}</p><p className="mt-2 text-2xl font-bold">{trip.expenses.length}</p></div></div>
      <div className="mt-6 border-t border-border pt-5 flex flex-wrap justify-between gap-3 text-sm"><span>{t('Pagamentos confirmados')}</span><span className="font-semibold text-primary">{t('{0} de {1}', { 0: confirmed, 1: payments.length })}</span></div>
      {ready && <p className="mt-4 flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="h-5 w-5 shrink-0" />{t('Todas as contas estão acertadas.')}</p>}
    </section>
    {finished ? <div className="surface p-6 flex flex-wrap items-center justify-between gap-4"><Button asChild variant="outline"><Link to={`/viagem/${trip.id}`}>{t('Voltar à viagem')}</Link></Button><ReportActions trip={trip} /></div> : <section className="surface p-6 sm:p-8">
      {!ready && <div role="status" className="mb-5 rounded-2xl bg-secondary p-4 text-sm leading-relaxed"><p className="font-semibold">{t('Antes de finalizar')}</p><p className="mt-1 text-muted-foreground">{t(trip.expenses.length ? "Confirme todos os pagamentos antes de finalizar a viagem." : "Registre as despesas e confira o acerto antes de finalizar.")}</p></div>}
      {!owner && <p className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4 shrink-0" />{t('Somente o organizador pode finalizar a viagem.')}</p>}
      {error && <p role="alert" className="action-error mb-4">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button asChild variant="ghost"><Link to={`/viagem/${trip.id}/acerto`}>{t('Continuar na viagem')}</Link></Button><Button disabled={saving || !ready || !owner} onClick={finish}>{saving ? <PaperPlaneLoader /> : <Flag />}{t(saving ? "Finalizando…" : "Sim, finalizar viagem")}</Button></div>
    </section>}
  </div>;
}

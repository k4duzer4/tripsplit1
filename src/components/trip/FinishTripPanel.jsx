import { t } from '@/lib/i18n';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { computeBalances, computePayments, paymentKey } from '@/lib/settlement';
import { Button } from '@/components/ui/button';
import { Flag, CheckCircle2, LockKeyhole, ArrowRight } from 'lucide-react';

export default function FinishTripPanel({ trip }) {
  const { user } = useAuth();
  const payments = computePayments(computeBalances(trip));
  const paid = payments.filter((payment) => trip.paymentsPaid?.[paymentKey(payment)]).length;
  const ready = trip.expenses.length > 0 && paid === payments.length;
  const owner = trip.ownerId === user?.id;
  if (trip.status === 'finished') return null;

  return <>
    <section className="journey-panel p-6 sm:p-8" aria-label={t("Finalizar viagem")}>
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#e6f2b3]">{ready ? <CheckCircle2 className="h-4 w-4" /> : <Flag className="h-4 w-4" />}{ready ? t("Tudo em dia") : t("Última parada")}</div>
        <h2 className="mt-3 text-2xl font-bold">{ready ? t("Contas fechadas. Boas histórias ficam.") : t("Feche a viagem com tranquilidade.")}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{ready ? t("Finalize para guardar despesas e acerto como um registro da viagem. Todo mundo pode consultar depois.") : trip.expenses.length ? t("Confirme todos os pagamentos acima. Quando o grupo estiver acertado, o organizador pode finalizar.") : t("Registre as despesas e confira o acerto. Depois, você poderá guardar esta viagem como finalizada.")}</p>
        {payments.length > 0 && <div className="mt-5"><div className="mb-2 flex justify-between text-xs text-white/75"><span>{t("Pagamentos confirmados")}</span><span>{t('{0} de {1}', { 0: paid, 1: payments.length })}</span></div><div role="progressbar" aria-label={t("Pagamentos confirmados")} aria-valuemin={0} aria-valuemax={payments.length} aria-valuenow={paid} className="h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-[#e6f2b3] transition-all" style={{ width: `${paid / payments.length * 100}%` }} /></div></div>}
        {owner ? <Button className="mt-6 bg-[#e6f2b3] text-[#173f34] hover:bg-[#d7e89b]" asChild><Link to={`/viagem/${trip.id}/finalizar`}><Flag /> {t("Finalizar viagem")} <ArrowRight /></Link></Button> : <p className="mt-5 flex items-center gap-2 text-xs text-white/70"><LockKeyhole className="h-4 w-4" /> {t("O organizador finaliza a viagem quando todos acertarem.")}</p>}
      </div>
    </section>
  </>;
}

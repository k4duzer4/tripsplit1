import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import { useTripStore } from '@/lib/tripStore';
import { computeBalances, computePayments, paymentKey } from '@/lib/settlement';
import { formatBRL } from '@/lib/format';
import ParticipantAvatar from './ParticipantAvatar';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Circle, PartyPopper, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettlementView({ trip }) {
  const { togglePaymentPaid } = useTripStore();
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const finished = trip.status === 'finished';
  const toggle = async (key) => {
    setBusyKey(key); setError('');
    try { await togglePaymentPaid(trip.id, key); }
    catch (paymentError) { setError(paymentError.message || t("Não foi possível confirmar o pagamento.")); }
    finally { setBusyKey(null); }
  };

  if (trip.expenses.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Scale className="w-7 h-7" />
        </div>
        <p className="font-medium text-foreground">{t("Nada para acertar ainda")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("Registre despesas para gerar a prestação de contas.")}</p>
      </div>
    );
  }

  const balances = computeBalances(trip);
  const payments = computePayments(balances);
  const creditors = trip.participants.filter((p) => balances[p.id] > 0).sort((a, b) => balances[b.id] - balances[a.id]);
  const debtors = trip.participants.filter((p) => balances[p.id] < 0).sort((a, b) => balances[a.id] - balances[b.id]);
  const settled = trip.participants.filter((p) => balances[p.id] === 0);
  const allPaid = payments.length > 0 && payments.every((p) => trip.paymentsPaid?.[paymentKey(p)]);

  return (
    <div className="space-y-6 fade-in-up">
      {error && <p role="alert" className="action-error">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-3">
            <TrendingUp className="w-4 h-4" /> {finished ? t("Quem recebeu no acerto") : t("Quem recebe")}
          </div>
          <div className="space-y-2.5">
            {creditors.length === 0 && <p className="text-sm text-muted-foreground">{t("Ninguém.")}</p>}
            {creditors.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <ParticipantAvatar participant={p} size="sm" />
                <span className="text-sm font-medium text-foreground flex-1">{p.name}</span>
                <span className="text-sm font-bold text-emerald-600">+{formatBRL(balances[p.id], trip.currency)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold mb-3">
            <TrendingDown className="w-4 h-4" /> {finished ? t("Quem pagou no acerto") : t("Quem paga")}
          </div>
          <div className="space-y-2.5">
            {debtors.length === 0 && <p className="text-sm text-muted-foreground">{t("Ninguém.")}</p>}
            {debtors.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <ParticipantAvatar participant={p} size="sm" />
                <span className="text-sm font-medium text-foreground flex-1">{p.name}</span>
                <span className="text-sm font-bold text-rose-500">{formatBRL(balances[p.id], trip.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {settled.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {settled.map((p) => p.name).join(', ')} {settled.length === 1 ? t("está quitado") : t("estão quitados")}.
        </p>
      )}

      {/* Suggested payments */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">{t("O caminho mais curto para acertar")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{finished ? t("Todos os pagamentos foram confirmados pelo grupo.") : t("Faça a transferência por fora do app e depois marque como pago.")}</p>
        {payments.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/70 p-6 text-center">
            <PartyPopper className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground">{t("Tudo equilibrado!")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("Nenhuma transferência necessária.")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {payments.map((p, idx) => {
              const key = paymentKey(p);
              const paid = !!trip.paymentsPaid?.[key];
              const from = trip.participants.find((x) => x.id === p.from);
              const to = trip.participants.find((x) => x.id === p.to);
              return (
                <div key={idx} className={`rounded-3xl border p-4 flex flex-wrap items-center gap-3 transition-all ${paid ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border/70'}`}>
                  <ParticipantAvatar participant={from} size="sm" />
                  <div className="flex-1 min-w-[120px]">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-foreground truncate">{from?.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{to?.name}</span>
                    </div>
                    <div className="text-base font-bold text-foreground">{formatBRL(p.amount, trip.currency)}</div>
                  </div>
                  <ParticipantAvatar participant={to} size="sm" />
                  <Button
                    size="sm"
                    variant={paid ? 'outline' : 'default'}
                    onClick={() => toggle(key)}
                    disabled={finished || busyKey !== null}
                    aria-label={t("{0} de {1} para {2}", { "0": paid ? t("Desfazer confirmação") : t("Confirmar pagamento"), "1": from?.name, "2": to?.name })}
                    className={`rounded-full shrink-0 ${paid ? 'text-emerald-600 border-emerald-300 bg-emerald-50 hover:bg-emerald-100' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    {busyKey === key ? t("Salvando…") : paid ? <><CheckCircle2 className="w-4 h-4 mr-1" /> {t("Pago")}</> : <><Circle className="w-4 h-4 mr-1" /> {t("Marcar pago")}</>}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {payments.length > 0 && (
        <div className={`rounded-2xl p-4 text-center font-medium ${allPaid ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
          {allPaid ? (
            <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> {t("Prestação de contas concluída!")}</span>
          ) : (
            t("Faltam {0} pagamento(s) para concluir.", { "0": payments.filter((p) => !trip.paymentsPaid?.[paymentKey(p)]).length })
          )}
        </div>
      )}
    </div>
  );
}

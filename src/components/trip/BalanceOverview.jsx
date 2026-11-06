import { t } from '@/lib/i18n';
import React from 'react';
import { computePaidAndConsumed, computeBalances } from '@/lib/settlement';
import { formatBRL } from '@/lib/format';
import ParticipantAvatar from './ParticipantAvatar';
import { Wallet, UtensilsCrossed, Scale } from 'lucide-react';

function Column({ title, icon: Icon, participants, trip, getValue, colorClass }) {
  return (
    <div className="bg-card rounded-2xl border border-border/70 p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      <div className="space-y-2.5">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <ParticipantAvatar participant={p} size="xs" />
            <span className="text-xs text-foreground flex-1 truncate">{p.name}</span>
            <span className={`text-xs font-semibold ${colorClass(getValue(p))}`}>{formatBRL(getValue(p), trip.currency)}</span>
          </div>
        ))}
        {participants.length === 0 && <p className="text-xs text-muted-foreground">{t("Sem participantes.")}</p>}
      </div>
    </div>
  );
}

export default function BalanceOverview({ trip }) {
  const pc = computePaidAndConsumed(trip);
  const balances = computeBalances(trip);
  const signClass = (v) => (v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-500' : 'text-muted-foreground');

  return (
    <div className="fade-in-up">
      <h2 className="font-semibold text-foreground mb-1">{t("Como o rateio foi calculado")}</h2>
      <p className="text-xs text-muted-foreground mb-4">{t("Despesas pagas, consumo e saldo antes das transferências do acerto.")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Column title={t("Quem pagou")} icon={Wallet} participants={trip.participants} trip={trip} getValue={(p) => pc[p.id]?.paid || 0} colorClass={() => 'text-foreground'} />
        <Column title={t("Quem consumiu")} icon={UtensilsCrossed} participants={trip.participants} trip={trip} getValue={(p) => pc[p.id]?.consumed || 0} colorClass={() => 'text-foreground'} />
        <Column title={t('Resultado')} icon={Scale} participants={trip.participants} trip={trip} getValue={(p) => balances[p.id] || 0} colorClass={signClass} />
      </div>
    </div>
  );
}

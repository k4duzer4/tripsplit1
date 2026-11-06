import { t } from '@/lib/i18n';
import React from 'react';
import { formatBRL, formatDateRange } from '@/lib/format';
import { computePaidAndConsumed, computeBalances } from '@/lib/settlement';
import { Wallet, Receipt, Users, Scale } from 'lucide-react';
import ParticipantAvatar from './ParticipantAvatar';

function StatCard({ icon: Icon, label, value, accent, wide = false }) {
  return (
    <div className={`surface min-w-0 p-4 sm:p-5 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={`text-xl sm:text-2xl font-bold font-heading ${accent || 'text-foreground'}`}>{value}</div>
    </div>
  );
}

export default function SummaryCards({ trip, youId }) {
  const totalCents = trip.expenses.reduce((s, e) => s + Math.round((Number(e.amount) || 0) * 100), 0);
  const pc = computePaidAndConsumed(trip);
  const balances = computeBalances(trip);
  const you = trip.participants.find((p) => p.id === youId);
  const youPaid = you ? pc[you.id]?.paid || 0 : 0;
  const youConsumed = you ? pc[you.id]?.consumed || 0 : 0;
  const youBalance = you ? balances[you.id] || 0 : 0;

  return (
    <div className="space-y-4 fade-in-up">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard wide icon={Wallet} label="Total da viagem" value={formatBRL(totalCents, trip.currency)} />
        <StatCard icon={Receipt} label="Despesas" value={String(trip.expenses.length)} />
        <StatCard icon={Users} label="Pessoas" value={String(trip.participants.length)} />
      </div>

      {you && (
        <div className="journey-panel p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <ParticipantAvatar participant={you} size="md" className="ring-white/40" />
            <div>
              <div className="text-white/70 text-xs font-medium">{t("Seu resumo ·")} {you.name}</div>
              <div className="text-sm font-semibold">{formatDateRange(trip.startDate, trip.endDate) || trip.name}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-white/70 text-[11px] font-medium flex items-center gap-1"><Wallet className="w-3 h-3" /> {t("Você pagou")}</div>
              <div className="text-base font-bold mt-0.5">{formatBRL(youPaid, trip.currency)}</div>
            </div>
            <div>
              <div className="text-white/70 text-[11px] font-medium flex items-center gap-1"><Receipt className="w-3 h-3" /> {t("Sua parte")}</div>
              <div className="text-base font-bold mt-0.5">{formatBRL(youConsumed, trip.currency)}</div>
            </div>
            <div>
              <div className="text-white/70 text-[11px] font-medium flex items-center gap-1"><Scale className="w-3 h-3" /> {t("Seu saldo")}</div>
              <div className={`text-base font-bold mt-0.5 ${youBalance > 0 ? 'text-white' : youBalance < 0 ? 'text-rose-100' : 'text-white'}`}>
                {trip.status === 'finished' ? t("Quitado") : <>{youBalance > 0 ? '+' : ''}{formatBRL(youBalance, trip.currency)}</>}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-white/70">
            {trip.status === 'finished' ? t("Viagem encerrada com todos os pagamentos confirmados.") : youBalance > 0 ? t("Você deve receber este valor.") : youBalance < 0 ? t("Você deve pagar este valor.") : t("Você está quitado.")}
          </div>
        </div>
      )}
    </div>
  );
}

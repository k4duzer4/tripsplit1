import { t } from '@/lib/i18n';
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import SettlementView from '@/components/trip/SettlementView';
import BalanceOverview from '@/components/trip/BalanceOverview';
import FinishTripPanel from '@/components/trip/FinishTripPanel';
import ReportActions from '@/components/trip/ReportActions';
import { Scale } from 'lucide-react';

export default function Settlement() {
  const { trip } = useOutletContext();
  const canExport = trip.expenses.length > 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Scale className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-bold text-2xl text-foreground">{t("Amizade em dia.")}</h2>
          <p className="text-sm text-muted-foreground">{t("Confira os valores e confirme os pagamentos.")}</p>
        </div>
        <ReportActions trip={trip} />
      </div>

      <SettlementView trip={trip} />

      <FinishTripPanel trip={trip} />

      {trip.expenses.length > 0 && <BalanceOverview trip={trip} />}
    </div>
  );
}

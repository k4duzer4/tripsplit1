import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTripStore } from '@/lib/tripStore';
import SummaryCards from '@/components/trip/SummaryCards';
import ExpenseList from '@/components/trip/ExpenseList';
import ExpenseFormDialog from '@/components/trip/ExpenseFormDialog';
import ParticipantManager from '@/components/trip/ParticipantManager';
import BalanceOverview from '@/components/trip/BalanceOverview';
import { Receipt, Users, BarChart3, Scale, Plus, ArrowRight, Check, CheckCircle2 } from 'lucide-react';

const TABS = [
  { id: 'resumo', label: t("Visão geral"), icon: BarChart3 },
  { id: 'despesas', label: t("Despesas"), icon: Receipt },
  { id: 'pessoas', label: t("Pessoas"), icon: Users },
];

export default function TripDashboard() {
  const { trip } = useOutletContext();
  const { user } = useAuth();
  const { addExpense } = useTripStore();
  const [tab, setTab] = useState('resumo');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const youId = trip.participants.find((person) => person.userId === user?.id)?.id || null;
  const finished = trip.status === 'finished';
  const isOwner = trip.ownerId === user?.id;

  return <div>
    <div className="route-tabs mb-6" role="tablist" aria-label={t("Seções da viagem")}>
      {TABS.map(({ id, label, icon: Icon }) => <button key={id} id={`tab-${id}`} role="tab" aria-controls={`panel-${id}`} aria-selected={tab === id} onClick={() => setTab(id)} className="route-tab !px-2"><Icon className="h-4 w-4" /><span>{label}</span></button>)}
    </div>
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === 'resumo' && <div className="space-y-6">
        {!finished && trip.expenses.length === 0 && <section className="surface p-5 sm:p-6">
          <p className="eyebrow">{t("O começo é simples")}</p><h2 className="mt-1 text-xl font-bold">{t("Prepare o grupo. Registre os momentos.")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[{ done: trip.participants.length > 1, title: t("Monte o grupo"), text: t("Inclua as pessoas ou compartilhe o convite."), action: () => setTab('pessoas') }, { done: false, title: t("Anote a primeira despesa"), text: t("Escolha quem pagou e quem participou."), action: () => setExpenseOpen(true) }, { done: false, title: t("Acerte no final"), text: t("A gente calcula quem paga quem."), href: `/viagem/${trip.id}/acerto` }].map((step, index) => {
              const inner = <><span className={`step-circle ${step.done ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}>{step.done ? <Check className="h-4 w-4" /> : index + 1}</span><span><span className="block text-sm font-semibold">{step.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{step.text}</span></span></>;
              return step.href ? <Link key={step.title} to={step.href} className="flex items-start gap-3 rounded-xl text-left hover:text-primary">{inner}</Link> : <button key={step.title} onClick={step.action} className="flex items-start gap-3 rounded-xl text-left hover:text-primary">{inner}</button>;
            })}
          </div>
        </section>}
        <SummaryCards trip={trip} youId={youId} />
        {!finished && <div className="grid gap-3 sm:grid-cols-2">
          <button className="surface flex items-center gap-4 p-5 text-left transition-colors hover:border-primary/40" onClick={() => setExpenseOpen(true)}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white"><Plus className="h-5 w-5" /></span><span className="flex-1"><span className="block font-semibold">{t("Registrar despesa")}</span><span className="block text-xs text-muted-foreground mt-1">{t("Pagou algo? Anote aqui.")}</span></span><ArrowRight className="h-4 w-4 text-primary" /></button>
          <button className="surface flex items-center gap-4 p-5 text-left transition-colors hover:border-primary/40" onClick={() => setTab('pessoas')}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary"><Users className="h-5 w-5" /></span><span className="flex-1"><span className="block font-semibold">{isOwner ? t("Organizar o grupo") : t("Ver o grupo")}</span><span className="block text-xs text-muted-foreground mt-1">{t('{0} pessoas nesta história.', { 0: trip.participants.length })}</span></span><ArrowRight className="h-4 w-4 text-primary" /></button>
        </div>}
        {trip.expenses.length > 0 && <BalanceOverview trip={trip} />}
        <Link to={`/viagem/${trip.id}/acerto`} className="journey-panel flex items-center gap-4 p-5 sm:p-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">{finished ? <CheckCircle2 /> : <Scale />}</span><span className="flex-1"><span className="block text-lg font-heading font-semibold">{finished ? t("Uma viagem, todas as contas em dia.") : t("Quem paga quem? Deixa com a gente.")}</span><span className="block mt-1 text-xs text-white/70">{finished ? t("Consulte o acerto, abra o PDF ou copie o relatório.") : t("Confira o acerto, confirme os pagamentos e finalize.")}</span></span><ArrowRight className="h-5 w-5 shrink-0" /></Link>
      </div>}
      {tab === 'despesas' && <ExpenseList trip={trip} youId={youId} />}
      {tab === 'pessoas' && <ParticipantManager trip={trip} />}
    </div>
    <ExpenseFormDialog open={expenseOpen} onOpenChange={setExpenseOpen} trip={trip} onSave={(data) => addExpense(trip.id, data)} />
  </div>;
}

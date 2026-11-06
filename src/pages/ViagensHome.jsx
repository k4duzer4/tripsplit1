import PaperPlaneLoader from '@/components/PaperPlaneLoader';
import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTripStore } from '@/lib/tripStore';
import { useAuth } from '@/lib/AuthContext';
import { formatBRL, formatDateRange } from '@/lib/format';
import { Plus, Users, ArrowUpRight, Receipt, Plane, LogOut, Ticket, CheckCircle2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ViagensHome() {
  const { trips, isLoading, joinTrip } = useTripStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [filter, setFilter] = useState('active');
  const active = trips.filter((trip) => trip.status !== 'finished');
  const finished = trips.filter((trip) => trip.status === 'finished');
  const visible = filter === 'active' ? active : finished;
  const firstName = (user?.full_name || '').split(' ')[0];

  const handleJoin = async (event) => {
    event.preventDefault();
    if (joining || !code.trim()) return;
    setJoining(true); setError('');
    try {
      const trip = await joinTrip(code);
      setJoinOpen(false); setCode('');
      navigate(`/viagem/${trip.id}`);
    } catch (joinError) { setError(joinError.message); }
    finally { setJoining(false); }
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="app-header">
        <div className="page-shell flex items-center justify-between py-4">
          <Link to="/viagens" className="flex items-center gap-3" aria-label={t("Trip Split, suas viagens")}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white -rotate-6"><Plane className="h-5 w-5" /></span>
            <span className="font-heading text-xl font-bold tracking-tight">trip<span className="text-primary">split</span><span className="text-primary">.</span></span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => logout()} aria-label={t("Sair da conta")}><LogOut className="h-4 w-4" /><span>{t("Sair")}</span></Button>
        </div>
      </header>
      <main className="page-shell space-y-8 py-7 sm:py-10">
        <section className="journey-panel p-6 sm:p-9">
          <div className="relative z-10">
            <p className="eyebrow !text-white/60">{t("Seu diário de bordo")}</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{firstName ? t("Bora viajar, {0}?", { "0": firstName }) : t("Mais histórias. Menos contas.")}</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">{t("O grupo curte a viagem. A gente organiza quem pagou, quem participou e o acerto no final.")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-[#e6f2b3] text-[#173f34] hover:bg-[#d7e89b]"><Link to="/criar-viagem"><Plus /> {t("Nova viagem")}</Link></Button>
              <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 hover:text-white" onClick={() => { setError(''); setJoinOpen(true); }}><Ticket /> {t("Tenho um convite")}</Button>
            </div>
          </div>
          <Compass className="absolute -right-4 top-5 hidden h-44 w-44 rotate-12 text-white/10 sm:block" strokeWidth={.7} aria-hidden="true" />
        </section>
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow">{t("Sua coleção de destinos")}</p><h2 className="mt-1 text-2xl font-bold">{t("Viagens do grupo")}</h2></div>
            <div className="route-tabs" role="tablist" aria-label={t("Situação das viagens")}>
              <button className="route-tab !py-2" role="tab" aria-selected={filter === 'active'} onClick={() => setFilter('active')}>{t("Em aberto")} <span className="opacity-60">{active.length}</span></button>
              <button className="route-tab !py-2" role="tab" aria-selected={filter === 'finished'} onClick={() => setFilter('finished')}>{t("Finalizadas")} <span className="opacity-60">{finished.length}</span></button>
            </div>
          </div>
          {isLoading ? <div role="status" className="surface flex justify-center gap-2 p-12"><PaperPlaneLoader className=" text-primary" /> {t("Carregando suas viagens…")}</div> : visible.length === 0 ? (
            <div className="empty-state">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-secondary text-primary">{filter === 'finished' ? <CheckCircle2 className="h-7 w-7" /> : <Plane className="h-7 w-7" />}</span>
              <h3 className="text-xl font-bold">{filter === 'finished' ? t("As memórias ficam por aqui.") : t("A próxima história começa aqui.")}</h3>
              <p className="mb-6 mt-2 max-w-sm text-sm text-muted-foreground">{filter === 'finished' ? t("Depois de acertar os pagamentos, finalize a viagem. Todos os registros continuam disponíveis.") : t("Crie uma viagem, convide o grupo e registre a primeira despesa. É simples assim.")}</p>
              {filter === 'active' && <Button asChild><Link to="/criar-viagem"><Plus /> {t("Criar minha viagem")}</Link></Button>}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((trip, index) => {
                const total = trip.expenses.reduce((sum, expense) => sum + Math.round(Number(expense.amount) * 100), 0);
                const done = trip.status === 'finished';
                return <Link key={trip.id} to={`/viagem/${trip.id}`} className="travel-card group" data-finished={done}>
                  <div className="mb-5 flex items-center justify-between"><span className="eyebrow">{t("Destino")} {String(index + 1).padStart(2, '0')}</span><span className={`status-chip ${done ? 'border-border text-muted-foreground' : 'border-primary/15 bg-primary/5 text-primary'}`}>{done ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-primary" />}{done ? t("Finalizada") : t("Em aberto")}</span></div>
                  <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold transition-colors group-hover:text-primary">{trip.name}</h3><ArrowUpRight className="h-5 w-5 shrink-0 text-primary" /></div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate) || t("Datas a combinar")}</p>
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-border pt-4"><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t('{0} pessoas', { 0: trip.participants.length })}</span><span className="flex items-center gap-1"><Receipt className="h-3.5 w-3.5" />{t('{0} despesas', { 0: trip.expenses.length })}</span></div><span className="whitespace-nowrap font-heading text-lg font-bold">{formatBRL(total, trip.currency)}</span></div>
                </Link>;
              })}
            </div>
          )}
        </section>
        <p className="text-center text-xs text-muted-foreground">{t("Divida a viagem. Não a amizade.")}</p>
      </main>
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>{t("Um convite para a próxima história")}</DialogTitle><DialogDescription>{t("Peça o código ao organizador e entre no grupo.")}</DialogDescription></DialogHeader>
          <form onSubmit={handleJoin} className="space-y-4"><Label htmlFor="invite-code">{t("Código da viagem")}</Label><Input id="invite-code" autoFocus value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="TRIP-XXXXX" className="text-center font-mono text-lg tracking-wider" required />{error && <p role="alert" className="action-error">{error}</p>}<DialogFooter><Button type="button" variant="ghost" onClick={() => setJoinOpen(false)}>{t("Cancelar")}</Button><Button disabled={joining || !code.trim()}>{joining ? t("Entrando…") : t("Entrar na viagem")}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

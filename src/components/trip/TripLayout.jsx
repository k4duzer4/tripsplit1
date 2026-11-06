import PaperPlaneLoader from '@/components/PaperPlaneLoader';
import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { useTripStore } from '@/lib/tripStore';
import { useAuth } from '@/lib/AuthContext';
import { formatDateRange, formatDate } from '@/lib/format';
import { ArrowLeft, Copy, Check, Scale, Settings, CheckCircle2, Ticket, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TripSettingsDialog from './TripSettingsDialog';

export default function TripLayout() {
  const { tripId } = useParams();
  const { getTrip, isLoading } = useTripStore();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const trip = getTrip(tripId);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!trip && isLoading) return <div role="status" className="min-h-screen flex items-center justify-center gap-2"><PaperPlaneLoader className=" text-primary" /> {t("Abrindo seu diário de bordo…")}</div>;
  if (!trip) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-2xl font-bold">{t("Não encontramos essa viagem")}</h1><p className="text-sm text-muted-foreground">{t("Confira se você faz parte do grupo ou peça um novo convite.")}</p><Button asChild><Link to="/viagens"><ArrowLeft /> {t("Minhas viagens")}</Link></Button></div>;

  const finished = trip.status === 'finished';
  const isSettlement = pathname.endsWith('/acerto');
  const isFinish = pathname.endsWith('/finalizar');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trip.inviteCode);
      setCopied(true); setCopyError('');
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopyError(t("Copie o código manualmente:") + trip.inviteCode); }
  };

  return <div className="min-h-screen">
    <header className="app-header">
      <div className="page-shell flex items-center justify-between gap-3 py-3">
        <Link to="/viagens" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /><span>{t("Minhas viagens")}</span></Link>
        <span className="font-heading text-lg font-bold text-primary">tripsplit.</span>
        {trip.ownerId === user?.id && !finished ? <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label={t("Configurações da viagem")}><Settings className="h-5 w-5" /></Button> : <span className="w-11" />}
      </div>
    </header>
    <main className="page-shell pt-6 pb-32 sm:pt-8">
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0"><p className="eyebrow flex items-center gap-2"><Plane className="h-3.5 w-3.5" /> {t("Diário de viagem")} <span className="text-primary">/ {finished ? t("Finalizada") : t("Em aberto")}</span></p><h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">{trip.name}</h1><p className="mt-1.5 text-sm text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate) || t("Datas a combinar")} <span className="mx-2 opacity-40">·</span> {trip.currency || 'BRL'}</p></div>
        {!finished && <Button variant="outline" size="sm" onClick={copy} disabled={trip.inviteActive === false}>{copied ? <Check /> : <Ticket />}{copied ? t("Código copiado") : trip.inviteActive === false ? t("Convite desativado") : t("Convidar o grupo")}{!copied && trip.inviteActive !== false && <Copy className="!h-3 !w-3" />}</Button>}
      </section>
      {copyError && <p role="alert" className="action-error mb-4">{copyError}</p>}
      {finished && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary p-4"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{t("Viagem finalizada. Amizade em dia.")}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("Encerrada em")} {formatDate(trip.finishedAt)}{t(". Despesas, acerto e relatórios continuam aqui para consulta.")}</p></div></div>}
      <Outlet context={{ trip }} />
    </main>
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 sm:px-2">
        <p className="hidden text-xs text-muted-foreground sm:block">{finished ? t("Todas as contas acertadas.") : isSettlement ? t("Confira e confirme os pagamentos abaixo.") : t("Cada despesa registrada, uma conta a menos.")}</p>
        <Button asChild className="w-full sm:w-auto sm:min-w-56"><Link to={isFinish ? `/viagem/${trip.id}/acerto` : isSettlement ? `/viagem/${trip.id}` : `/viagem/${trip.id}/acerto`}>{isFinish || isSettlement ? <ArrowLeft /> : <Scale />}{isFinish ? t("Voltar ao acerto") : isSettlement ? t("Voltar à viagem") : finished ? t("Consultar acerto") : t("Acertar as contas")}</Link></Button>
      </div>
    </div>
    <TripSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} trip={trip} isOwner={trip.ownerId === user?.id && !finished} />
  </div>;
}

import { formatMoney } from '@/lib/format';
import { t } from '@/lib/i18n';
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Plane, ArrowRight, CheckCircle2, Receipt, Users, Compass, Scale } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, authChecked } = useAuth();
  if (authChecked && isAuthenticated) return <Navigate to="/viagens" replace />;
  return <div className="min-h-screen">
    <header className="page-shell flex items-center justify-between py-5">
      <Link to="/" className="flex items-center gap-2.5 font-heading text-xl font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white -rotate-6"><Plane className="h-5 w-5" /></span>tripsplit<span className="-ml-2 text-primary">.</span></Link>
      <Button asChild variant="ghost" size="sm"><Link to="/login">{t("Entrar")} <ArrowRight /></Link></Button>
    </header>
    <main className="page-shell pb-12">
      <section className="grid items-center gap-10 py-9 sm:grid-cols-[1.1fr_1fr] sm:py-16">
        <div>
          <p className="eyebrow !text-primary">{t("Bons destinos. Boas companhias.")}</p>
          <h1 className="mt-5 text-5xl font-bold leading-[1.06] tracking-[-.045em] sm:text-6xl">{t("Divida a viagem.")}<br /><span className="text-primary">{t("Não a amizade.")}</span></h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{t("Da primeira reserva ao último café. Junte o grupo, anote as despesas e termine a viagem com todas as contas em dia.")}</p>
          <Button asChild size="lg" className="mt-7"><Link to="/register">{t("Começar uma história")} <ArrowRight /></Link></Button>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {t("Fácil de usar. Feito para compartilhar.")}</p>
        </div>
        <div className="relative mx-auto w-full max-w-sm py-6" aria-label={t("Exemplo de uma viagem organizada")}>
          <div className="absolute inset-0 rounded-full bg-secondary -rotate-12" />
          <div className="surface relative rotate-[-3deg] !rounded-[2rem] p-6 shadow-xl shadow-primary/5">
            <div className="flex justify-between"><p className="eyebrow">{t('Seu diário de bordo')} / 01</p><Compass className="h-6 w-6 text-primary" /></div>
            <h2 className="mt-6 text-3xl font-bold">{t("Um fim de")}<br />{t("semana na praia.")}</h2><p className="mt-2 text-xs text-muted-foreground">{t("4 amigos · um monte de histórias")}</p>
            <div className="mt-6 border-t border-dashed border-border pt-5"><p className="eyebrow">{t("Total compartilhado")}</p><p className="mt-2 font-heading text-3xl font-bold">{formatMoney(150000)}</p></div>
            <div className="mt-5 space-y-2"><div className="flex justify-between rounded-2xl bg-secondary p-3 text-xs"><span>{t("Marina recebe")}</span><span className="font-bold text-primary">{formatMoney(37500)}</span></div><div className="flex justify-between rounded-2xl bg-background p-3 text-xs"><span>{t("Lucas paga")}</span><span className="font-bold">{formatMoney(12500)}</span></div></div>
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-primary p-3 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4" /> {t("Contas fechadas, amizade em dia.")}</div>
          </div>
          <span className="absolute -right-1 -top-1 rotate-6 rounded-2xl border border-primary/15 bg-[#e6f2b3] px-4 py-3 text-xs font-bold text-primary shadow-sm">{t("Só falta fazer as malas.")}</span>
        </div>
      </section>
      <section className="mt-3 rounded-[2rem] border border-border bg-card p-6 sm:p-8">
        <p className="eyebrow">{t("Do embarque à última conta")}</p><h2 className="mt-2 text-2xl font-bold">{t("Um roteiro simples.")}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[{ icon: Users, title: t("Junte o grupo"), text: t("Crie a viagem e inclua as pessoas. Com conta ou só como convidado.") }, { icon: Receipt, title: t("Anote o que gastaram"), text: t("Quem pagou? Quem participou? O resto a gente calcula.") }, { icon: Scale, title: t("Acerte e finalize"), text: t("Confirme os pagamentos e guarde a viagem no seu histórico.") }].map(({ icon: Icon, title, text }, index) => <div key={title}><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon className="h-5 w-5" /></span><span className="font-heading text-3xl text-border">0{index + 1}</span></div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}
        </div>
      </section>
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground"><span>{t("tripsplit. · feito para ir junto")}</span><Link to="/register" className="flex items-center gap-2 font-semibold text-primary">{t("Sua próxima viagem começa aqui")} <ArrowRight className="h-3.5 w-3.5" /></Link></footer>
    </main>
  </div>;
}

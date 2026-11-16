import React from 'react';
import { t } from '@/lib/i18n';
import { useLocation } from 'react-router-dom';

function AdSlot({ side }) {
  return (
    <aside
      aria-label={t('Publicidade')}
      data-ad-slot={side}
      className="sticky top-28 w-40 rounded-3xl border border-dashed border-border bg-card/65 px-4 py-5 text-center"
    >
      <p className="eyebrow">{t('Publicidade')}</p>
      <div className="mt-4 flex min-h-56 items-center justify-center rounded-2xl bg-secondary/55 px-3">
        <p className="text-xs leading-relaxed text-muted-foreground">{t('Espaço para anúncio')}</p>
      </div>
    </aside>
  );
}

export default function AdRails({ children }) {
  const { pathname } = useLocation();
  const showSlots = pathname === '/' || pathname === '/viagens' || pathname.startsWith('/viagem/');

  if (!showSlots) return children;

  return (
    <div className="mx-auto grid w-full grid-cols-1 2xl:max-w-[1440px] 2xl:grid-cols-[minmax(160px,1fr)_minmax(0,896px)_minmax(160px,1fr)] 2xl:gap-8 2xl:px-6">
      <div className="hidden justify-center pt-36 2xl:flex"><AdSlot side="left" /></div>
      <div className="min-w-0">{children}</div>
      <div className="hidden justify-center pt-52 2xl:flex"><AdSlot side="right" /></div>
    </div>
  );
}

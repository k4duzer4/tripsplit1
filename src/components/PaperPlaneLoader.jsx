import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function PaperPlaneLoader({ className = '', label = '' }) {
  return <span className={cn('paper-plane-loader inline-flex shrink-0 h-5 w-5', className)} role={label ? 'status' : undefined}>
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="h-full w-full overflow-visible">
      <path className="plane-trail" d="M2 25c5 3 8 0 8-3s-4-4-5-1 2 5 6 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 3" />
      <g className="plane-flight" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 22-7-7 22-5-10-10-5Z"/><path d="m15 17 12-12M15 17l-3 6 1-7" /></g>
    </svg>
    {label && <span className="sr-only">{label}</span>}
  </span>;
}

export function LoadingScreen() {
  return <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background" role="status"><PaperPlaneLoader className="h-12 w-12 text-primary" /><span className="text-sm text-muted-foreground">{t('Abrindo seu diário de bordo…')}</span></div>;
}

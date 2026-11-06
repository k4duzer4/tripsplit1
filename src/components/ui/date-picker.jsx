import { lazy, Suspense, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaperPlaneLoader from '@/components/PaperPlaneLoader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { t, locale } from '@/lib/i18n';
import { formatDate } from '@/lib/format';
import { parseCalendarDate, calendarDateValue, calendarMonth, clampCalendarMonth } from '@/lib/calendarDate';
import { useIsMobile } from '@/hooks/use-mobile';

const Calendar = lazy(() => import('@/components/ui/calendar').then((module) => ({ default: module.Calendar })));

export function DatePicker({ id, value = '', onChange, label = t('Data'), min = '', max = '', disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [month, setMonth] = useState(() => calendarMonth(parseCalendarDate(value) || new Date()));
  const selected = parseCalendarDate(value);
  const minDate = parseCalendarDate(min);
  const maxDate = parseCalendarDate(max);
  const today = parseCalendarDate(calendarDateValue(new Date()));
  const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, index, 1)));
  const firstYear = minDate?.getFullYear() ?? Math.min(1900, month.getFullYear());
  const lastYear = maxDate?.getFullYear() ?? Math.max(new Date().getFullYear() + 50, month.getFullYear());
  const years = Array.from({ length: Math.max(0, lastYear - firstYear + 1) }, (_, index) => firstYear + index);
  const setVisibleMonth = (date) => setMonth(clampCalendarMonth(date, minDate, maxDate));
  const choose = (date) => { onChange(calendarDateValue(date)); setOpen(false); };
  const disabledDays = [minDate && { before: minDate }, maxDate && { after: maxDate }].filter(Boolean);
  const previousDisabled = minDate && calendarMonth(month, -1) < calendarMonth(minDate);
  const nextDisabled = maxDate && calendarMonth(month, 1) > calendarMonth(maxDate);
  const todayDisabled = (minDate && today < minDate) || (maxDate && today > maxDate);

  return <Popover modal open={open} onOpenChange={(next) => {
    if (next) setVisibleMonth(selected || today);
    setOpen(next);
  }}>
    <PopoverTrigger asChild>
      <Button type="button" id={id} variant="outline" disabled={disabled} aria-label={label} aria-describedby={`${id}-value`} className={cn('h-12 w-full min-w-0 justify-between rounded-2xl bg-card px-3 font-normal shadow-none hover:bg-secondary/40 focus-visible:ring-ring/20', className)}>
        <span id={`${id}-value`} className={cn('truncate', !value && 'text-muted-foreground/70')}>{value ? formatDate(value) : t('Selecione a data')}</span><CalendarDays className="h-4 w-4 shrink-0 text-primary/70" />
      </Button>
    </PopoverTrigger>
    <PopoverContent side={isMobile ? 'bottom' : 'right'} align="start" sideOffset={8} collisionPadding={16} aria-label={t('Escolher data')} className="date-picker-panel w-[320px] max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-3xl p-4 shadow-xl shadow-primary/10">
      <p className="eyebrow mb-3">{label}</p>
      <div className="mb-3 flex items-center gap-1.5">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label={t('Mês anterior')} disabled={!!previousDisabled} onClick={() => setVisibleMonth(calendarMonth(month, -1))}><ChevronLeft /></Button>
        <Select value={String(month.getMonth())} onValueChange={(next) => setVisibleMonth(new Date(month.getFullYear(), Number(next), 1, 12))}>
          <SelectTrigger aria-label={t('Mês')} className="h-9 min-w-0 flex-1 rounded-xl border-transparent bg-secondary/60 px-2 capitalize font-semibold text-primary"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-64">{monthNames.map((name, index) => <SelectItem key={index} value={String(index)} disabled={(minDate && new Date(month.getFullYear(), index + 1, 0, 12) < minDate) || (maxDate && new Date(month.getFullYear(), index, 1, 12) > maxDate)} className="capitalize">{name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(month.getFullYear())} onValueChange={(next) => setVisibleMonth(new Date(Number(next), month.getMonth(), 1, 12))}>
          <SelectTrigger aria-label={t('Ano')} className="h-9 w-[78px] shrink-0 rounded-xl border-transparent bg-secondary/60 px-2 font-semibold text-primary"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-64">{years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label={t('Próximo mês')} disabled={!!nextDisabled} onClick={() => setVisibleMonth(calendarMonth(month, 1))}><ChevronRight /></Button>
      </div>
      <Suspense fallback={<div className="flex h-[295px] items-center justify-center"><PaperPlaneLoader label={t('Carregando…')} className="h-8 w-8 text-primary" /></div>}>
        <Calendar mode="single" required selected={selected} month={month} onMonthChange={setVisibleMonth} onSelect={choose} disabled={disabledDays} fixedWeeks initialFocus className="p-0" classNames={{ caption: 'hidden' }} />
      </Suspense>
      <div className="mt-3 flex justify-between gap-2 border-t border-border/70 pt-3">
        <Button type="button" size="sm" variant="ghost" disabled={!value} onClick={() => choose(undefined)}>{t('Limpar')}</Button>
        <Button type="button" size="sm" variant="secondary" disabled={!!todayDisabled} onClick={() => choose(today)}>{t('Hoje')}</Button>
      </div>
    </PopoverContent>
  </Popover>;
}

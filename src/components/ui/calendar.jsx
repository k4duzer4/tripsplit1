import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, Button as DayButton, useDayRender } from "react-day-picker"
import { ptBR, enUS, es } from 'date-fns/locale';
import { language, locale, t } from '@/lib/i18n';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function CalendarDay({ date, displayMonth }) {
  const ref = React.useRef(null);
  const day = useDayRender(date, displayMonth, ref);
  const label = new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date);
  if (day.isHidden) return <div role="gridcell" />;
  if (!day.isButton) return <div {...day.divProps} aria-label={label} />;
  return <DayButton ref={ref} {...day.buttonProps} aria-label={label} aria-current={day.activeModifiers.today ? 'date' : undefined} />;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    (<DayPicker
      locale={{ pt: ptBR, en: enUS, es }[language]}
      labels={{
        labelPrevious: () => t('Mês anterior'),
        labelNext: () => t('Próximo mês'),
        labelDay: (date) => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date),
      }}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "w-full space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell:
          "flex-1 text-muted-foreground rounded-xl py-2 text-[10px] uppercase font-semibold",
        row: "flex w-full mt-1",
        cell: cn(
          "relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-secondary [&:has([aria-selected].day-outside)]:bg-secondary/50 [&:has([aria-selected].day-range-end)]:rounded-r-xl",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-xl"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-full rounded-xl p-0 font-medium shadow-none aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-secondary text-primary ring-1 ring-inset ring-primary/15",
        day_outside:
          "day-outside text-muted-foreground/40 aria-selected:bg-secondary/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Day: CalendarDay,
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props} />)
  );
}
Calendar.displayName = "Calendar"

export { Calendar }

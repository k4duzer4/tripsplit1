import { Coins } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';

const currencies = [
  { value: 'BRL', label: 'BRL — Real brasileiro' },
  { value: 'USD', label: 'USD — Dólar americano' },
  { value: 'EUR', label: 'EUR — Euro' },
];

export function CurrencySelect({ id, value, onChange, disabled = false, className = '' }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger id={id} aria-label={t('Moeda')} className={className}>
      <div className="flex min-w-0 items-center gap-2.5"><Coins className="h-4 w-4 shrink-0 text-primary/70" /><SelectValue /></div>
    </SelectTrigger>
    <SelectContent sideOffset={6} collisionPadding={16}>
      {currencies.map((currency) => <SelectItem key={currency.value} value={currency.value}>{t(currency.label)}</SelectItem>)}
    </SelectContent>
  </Select>;
}

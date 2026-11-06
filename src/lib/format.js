import { locale } from './i18n.js';
export const toCents = (brl) => Math.round((Number(brl) || 0) * 100);
export const fromCents = (cents) => (cents || 0) / 100;

export const formatMoney = (cents, currency = 'BRL', language = locale) =>
  new Intl.NumberFormat(language, { style: 'currency', currency }).format((cents || 0) / 100);

export const formatBRL = (cents, currency = 'BRL') => formatMoney(cents, currency);

export const formatBRLValue = (value, currency = 'BRL') =>
  formatMoney(toCents(value), currency);

export const formatDate = (iso, language = locale) => {
  if (!iso) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(language);
};

export const formatDateRange = (start, end) => {
  if (!start && !end) return '';
  if (start && end) return `${formatDate(start)} — ${formatDate(end)}`;
  return formatDate(start || end);
};

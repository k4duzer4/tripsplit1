import { locale } from './i18n.js';

// Keep integer cents as the source of truth; formatting never enters API payloads.
export function maskMoneyInput(value, language = locale) {
  const formatter = new Intl.NumberFormat(language, { useGrouping: false });
  const digitMap = Object.fromEntries(Array.from({ length: 10 }, (_, digit) => [formatter.format(digit), String(digit)]));
  const normalized = Array.from(String(value), (character) => digitMap[character] ?? character).join('');
  const digits = normalized.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '').slice(0, 12);
  if (!digits) return { cents: 0, display: '' };
  const cents = Number(digits);
  return { cents, display: formatMoneyInput(cents, language) };
}

export function formatMoneyInput(cents, language = locale) {
  return new Intl.NumberFormat(language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

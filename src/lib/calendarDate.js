// Date-only values stay in local time, never through toISOString/UTC.
export function parseCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

export function calendarDateValue(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calendarMonth(date, offset = 0) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
}

export function clampCalendarMonth(date, min, max) {
  const month = calendarMonth(date);
  if (min && month < calendarMonth(min)) return calendarMonth(min);
  if (max && month > calendarMonth(max)) return calendarMonth(max);
  return month;
}

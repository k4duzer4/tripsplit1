import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseCalendarDate, calendarDateValue, calendarMonth, clampCalendarMonth } from '../src/lib/calendarDate.js';

test('datas de calendário preservam o dia local e validam datas reais', () => {
  for (const value of ['2004-03-12', '2024-02-29', '2026-10-09']) {
    const date = parseCalendarDate(value);
    assert.equal(date.getHours(), 12);
    assert.equal(calendarDateValue(date), value);
  }
  for (const value of ['', '2026-02-29', '2026-13-01', '2026-04-31', '12/03/2004']) assert.equal(parseCalendarDate(value), undefined);
  assert.equal(calendarDateValue(undefined), '');
});

test('navegação respeita limites e atravessa viradas de ano', () => {
  assert.equal(calendarDateValue(calendarMonth(parseCalendarDate('2026-12-31'), 1)), '2027-01-01');
  assert.equal(calendarDateValue(calendarMonth(parseCalendarDate('2026-01-15'), -1)), '2025-12-01');
  const min = parseCalendarDate('2026-10-09'), max = parseCalendarDate('2027-03-15');
  assert.equal(calendarDateValue(clampCalendarMonth(parseCalendarDate('2004-03-12'), min, max)), '2026-10-01');
  assert.equal(calendarDateValue(clampCalendarMonth(parseCalendarDate('2030-05-12'), min, max)), '2027-03-01');
});

test('todos os formulários usam os mesmos controles de data e moeda', () => {
  for (const file of ['src/pages/CreateTrip.jsx', 'src/components/trip/TripSettingsDialog.jsx', 'src/components/trip/ExpenseFormDialog.jsx']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(source.includes('<DatePicker'));
    assert.ok(!/type=["']date["']|<select\b/.test(source), `${file}: controle nativo reapareceu`);
    if (!file.includes('Expense')) assert.ok(source.includes('<CurrencySelect'));
  }
});

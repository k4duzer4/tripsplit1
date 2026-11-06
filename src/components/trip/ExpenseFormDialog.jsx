import { t } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { calendarDateValue } from '@/lib/calendarDate';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/categories';
import CategoryIcon from './CategoryIcon';
import ParticipantAvatar from './ParticipantAvatar';
import { Check } from 'lucide-react';
import { maskMoneyInput, formatMoneyInput } from '@/lib/moneyInput';
import { toCents } from '@/lib/format';
import PaperPlaneLoader from '@/components/PaperPlaneLoader';

export default function ExpenseFormDialog({ open, onOpenChange, trip, expense, onSave }) {
  const [description, setDescription] = useState('');
  const [amountCents, setAmountCents] = useState(null);
  const [paidBy, setPaidBy] = useState('');
  const [participantIds, setParticipantIds] = useState([]);
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Outros');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDescription(expense?.description || '');
    setAmountCents(expense ? toCents(expense.amount) : null);
    setPaidBy(expense?.paidBy || trip.participants[0]?.id || '');
    setParticipantIds(expense?.participantIds || trip.participants.map((p) => p.id));
    setDate(expense?.date || calendarDateValue(new Date()));
    setCategory(expense?.category || 'Outros');
    setError('');
  }, [open, expense, trip]);

  const toggle = (id) => setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allSelected = participantIds.length === trip.participants.length;

  const submit = async () => {
    if (saving || trip.status === 'finished') return;
    if (!description.trim()) return setError(t("Adicione uma descrição."));
    const val = amountCents / 100;
    if (!Number.isFinite(val) || val <= 0) return setError(t("Informe um valor válido, com até duas casas decimais."));
    if (!paidBy) return setError(t("Selecione quem pagou."));
    if (participantIds.length === 0) return setError(t("Selecione ao menos um participante."));
    setSaving(true);
    try {
      await onSave({
        id: expense?.id,
        description: description.trim(),
        amount: val,
        paidBy,
        participantIds,
        date,
        category,
      });
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError.message || t("Não foi possível salvar a despesa."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{expense ? t("Editar despesa") : t("Nova despesa")}</DialogTitle>
          <DialogDescription>{t("Registre quem pagou e quem participou desta despesa.")}</DialogDescription>
        </DialogHeader>

        {trip.participants.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground"> {t("Adicione participantes à viagem antes de registrar despesas.")} </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="desc">{t("Descrição")}</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Ex: Hotel, Jantar, Ônibus...")} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amt">{t('Valor ({0})', { 0: trip.currency || 'BRL' })}</Label>
                <Input id="amt" inputMode="numeric" autoComplete="off" value={amountCents === null ? '' : formatMoneyInput(amountCents)} onChange={(e) => {
                  const field = e.target;
                  const digitsAfterCursor = field.value.slice(field.selectionStart ?? field.value.length).replace(/[^\p{Decimal_Number}]/gu, '').length;
                  const masked = maskMoneyInput(field.value);
                  setAmountCents(masked.display ? masked.cents : null);
                  requestAnimationFrame(() => {
                    let caret = field.value.length;
                    let remaining = digitsAfterCursor;
                    while (caret > 0 && remaining > 0) { caret--; if (/\p{Decimal_Number}/u.test(field.value[caret])) remaining--; }
                    field.setSelectionRange(caret, caret);
                  });
                }} placeholder={formatMoneyInput(0)} aria-describedby="amount-hint" className="mt-1 tabular-nums" />
              </div>
              <div>
                <Label htmlFor="dt">{t("Data")}</Label>
                <DatePicker id="dt" value={date} onChange={setDate} disabled={saving} className="mt-1" />
              </div>
            </div>

            <p id="amount-hint" className="text-xs text-muted-foreground">{t('Digite os centavos; a vírgula e os separadores são automáticos.')}</p>

            <div>
              <Label>{t("Categoria")}</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    aria-pressed={category === c.value}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-medium transition-all ${
                      category === c.value ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                    style={category === c.value ? { backgroundColor: c.color } : {}}
                  >
                    <CategoryIcon name={c.icon} className="w-4 h-4" />
                    {t(c.label)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="paid-by">{t("Quem pagou?")}</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger id="paid-by" className="mt-1"><SelectValue placeholder={t("Selecione")} /></SelectTrigger>
                <SelectContent>
                  {trip.participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>{t("Quem participou?")}</Label>
                <button type="button" onClick={() => setParticipantIds(allSelected ? [] : trip.participants.map((p) => p.id))} className="text-[11px] text-primary font-medium hover:underline">
                  {allSelected ? t("Limpar") : t("Selecionar todos")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {trip.participants.map((p) => {
                  const active = participantIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-pressed={active}
                      className={`flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border text-xs font-medium transition-all ${
                        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <ParticipantAvatar participant={p} size="xs" className={active ? 'ring-primary/30' : 'opacity-60 grayscale'} />
                      {p.name}
                      {active && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="rounded-2xl bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">{t("O valor será dividido igualmente entre as pessoas selecionadas.")} {Object.values(trip.paymentsPaid || {}).some(Boolean) && t("Alterar despesas reinicia a confirmação dos pagamentos para conferir o novo acerto.")}</p>
            {error && <p className="action-error" role="alert">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>{t("Cancelar")}</Button>
          <Button onClick={submit} disabled={saving || trip.participants.length === 0 || trip.status === 'finished'} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving && <PaperPlaneLoader />} {saving ? t("Salvando…") : expense ? t("Salvar alterações") : t("Adicionar despesa")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

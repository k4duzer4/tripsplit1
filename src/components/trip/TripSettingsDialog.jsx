import { t } from '@/lib/i18n';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencySelect } from '@/components/ui/currency-select';
import { useTripStore } from '@/lib/tripStore';

export default function TripSettingsDialog({ open, onOpenChange, trip, isOwner }) {
  const { updateTrip, updateInvite, deleteTrip } = useTripStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', currency: 'BRL' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: trip.name, startDate: trip.startDate || '', endDate: trip.endDate || '', currency: trip.currency || 'BRL' });
  }, [open, trip]);

  if (!isOwner) return null;

  const save = async () => {
    try {
      setSaving(true); setError('');
      await updateTrip(trip.id, form);
      onOpenChange(false);
    } catch (saveError) { setError(saveError.message || t("Não foi possível atualizar a viagem.")); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    try { await deleteTrip(trip.id); navigate('/viagens'); }
    catch (deleteError) { setError(deleteError.message || t("Não foi possível excluir a viagem.")); }
    finally { setSaving(false); }
  };

  const changeInvite = async (patch) => {
    setSaving(true); setError('');
    try { await updateInvite(trip.id, patch); }
    catch (inviteError) { setError(inviteError.message || t("Não foi possível atualizar o convite.")); }
    finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={(value) => { if (!saving) { setConfirmDelete(false); setError(''); onOpenChange(value); } }}>
    <DialogContent className="sm:max-w-md rounded-3xl">
      <DialogHeader><DialogTitle>{t("Configurações da viagem")}</DialogTitle><DialogDescription>{t("Gerencie os dados e o convite do grupo.")}</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <div><Label htmlFor="trip-name">{t("Nome")}</Label><Input id="trip-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="trip-start">{t("Início")}</Label><DatePicker id="trip-start" label={t('Início')} value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} disabled={saving} className="mt-1.5" /></div><div><Label htmlFor="trip-end">{t("Fim")}</Label><DatePicker id="trip-end" label={t('Fim')} min={form.startDate} value={form.endDate} onChange={(endDate) => setForm({ ...form, endDate })} disabled={saving} className="mt-1.5" /></div></div>
        <div><Label htmlFor="trip-currency">{t("Moeda")}</Label><CurrencySelect id="trip-currency" value={form.currency} onChange={(currency) => setForm({ ...form, currency })} disabled={saving} className="mt-1.5" /></div>
        <p className="text-xs text-muted-foreground">{t("Alterar a moeda muda a identificação dos valores, sem converter o câmbio.")}</p>
        <div className="rounded-2xl bg-secondary p-4"><p className="text-sm font-semibold">{t("Convite do grupo")}</p><p className="text-xs text-muted-foreground mt-1">{trip.inviteActive === false ? t("Convite desativado") : t("Código: {0}", { "0": trip.inviteCode })}</p><div className="flex gap-2 mt-3"><Button disabled={saving} size="sm" variant="outline" onClick={() => changeInvite({ regenerate: true, active: true, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() })}>{t("Gerar novo código")}</Button><Button disabled={saving} size="sm" variant="outline" onClick={() => changeInvite({ active: trip.inviteActive === false })}>{trip.inviteActive === false ? t("Ativar") : t("Desativar")}</Button></div></div>
        {confirmDelete && <div className="action-error"><p className="font-semibold">{t("Excluir a viagem definitivamente?")}</p><p className="mt-1">{t("Todas as despesas e pessoas serão removidas. Para guardar o histórico, use Finalizar viagem na tela de acerto.")}</p><Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>{t("Manter minha viagem")}</Button></div>}
        {error && <p role="alert" className="action-error">{error}</p>}
      </div>
      <DialogFooter><Button variant={confirmDelete ? 'destructive' : 'ghost'} disabled={saving} onClick={remove}>{confirmDelete ? t("Sim, excluir definitivamente") : t("Excluir viagem")}</Button><Button onClick={save} disabled={saving || !form.name.trim()}>{saving ? t("Salvando…") : t("Salvar alterações")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

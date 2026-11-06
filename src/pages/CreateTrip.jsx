import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTripStore } from '@/lib/tripStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencySelect } from '@/components/ui/currency-select';
import { ArrowLeft, Plane, Calendar, Sparkles } from 'lucide-react';

export default function CreateTrip() {
  const { createTrip } = useTripStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) { setError(t("Dê um nome à sua viagem.")); return; }
    if (startDate && endDate && endDate < startDate) { setError(t("A data final precisa ser igual ou posterior à inicial.")); return; }
    try {
      setSaving(true); setError('');
      const id = await createTrip({ name: name.trim(), startDate, endDate, currency });
      navigate(`/viagem/${id}`);
    } catch (submitError) {
      setError(submitError.message || t("Não foi possível criar a viagem."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-full -ml-1">
            <Link to="/viagens" aria-label={t("Voltar às viagens")}><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-heading font-bold text-foreground">{t("Criar viagem")}</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <p className="eyebrow">{t("Próxima parada")}</p>
            <h2 className="font-heading font-bold text-2xl text-foreground">{t("Uma nova história.")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("Escolha um nome. O grupo entra depois.")}</p>
          </div>
        </div>

        <form onSubmit={submit} className="surface p-5 sm:p-7 space-y-5">
          <div>
            <Label htmlFor="name">{t("Nome da viagem")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Ex: Viagem para João Pessoa")} className="mt-1.5" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sd" className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {t("Data inicial")}</Label>
              <DatePicker id="sd" label={t('Data inicial')} value={startDate} onChange={setStartDate} disabled={saving} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ed" className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {t("Data final")}</Label>
              <DatePicker id="ed" label={t('Data final')} min={startDate} value={endDate} onChange={setEndDate} disabled={saving} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="currency">{t("Moeda")}</Label>
            <CurrencySelect id="currency" value={currency} onChange={setCurrency} disabled={saving} className="mt-1.5" />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{t("As datas são opcionais. Você já entra como organizador e pode convidar o grupo assim que criar.")}</p>
          {error && <p className="action-error" role="alert">{error}</p>}

          <Button type="submit" disabled={saving} className="w-full h-12">
            <Sparkles className="w-5 h-5 mr-1.5" /> {saving ? t("Preparando sua viagem…") : t("Criar viagem")}
          </Button>
        </form>
      </div>
    </div>
  );
}

import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import { useTripStore } from '@/lib/tripStore';
import { useAuth } from '@/lib/AuthContext';
import ParticipantAvatar from './ParticipantAvatar';
import { Plus, Trash2, AlertTriangle, UserCircle2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ParticipantManager({ trip }) {
  const { addParticipant, removeParticipant } = useTripStore();
  const { user } = useAuth();
  const canManage = trip.status !== 'finished' && trip.ownerId === user?.id;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [withAccount, setWithAccount] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!canManage || busy) return;
    if (!name.trim()) return;
    if (withAccount && !email.trim()) return;
    try {
      setBusy(true);
      setError('');
      await addParticipant(trip.id, withAccount ? { name: name.trim(), email: email.trim(), hasAccount: true } : { name: name.trim(), hasAccount: false });
      setName('');
      setEmail('');
      setWithAccount(false);
    } catch (addError) {
      setError(addError.message || t("Não foi possível adicionar o participante."));
    } finally {
      setBusy(false);
    }
  };

  const canRemove = (pid) => canManage &&
    trip.participants.find((p) => p.id === pid)?.userId !== trip.ownerId &&
    !trip.expenses.some((e) => e.paidBy === pid || e.participantIds.includes(pid));

  const remove = async (pid) => {
    setBusy(true); setError('');
    try { await removeParticipant(trip.id, pid); }
    catch (removeError) { setError(removeError.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      {canManage && <div className="surface p-5">
        <h2 className="font-semibold text-foreground mb-1">{t("Adicionar participante")}</h2>
        <p className="text-sm text-muted-foreground mb-3">{t("Com conta Trip Split ou apenas como convidado.")}</p>

        <div className="flex gap-1 p-1 bg-secondary/60 rounded-full mb-3">
          <button onClick={() => setWithAccount(false)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition-all ${!withAccount ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <UserCircle2 className="w-4 h-4" /> {t("Convidado")} </button>
          <button onClick={() => setWithAccount(true)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition-all ${withAccount ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <Mail className="w-4 h-4" /> {t("Com conta")} </button>
        </div>

        <div className="space-y-2 mb-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={t("Nome do participante")} className="rounded-xl" />
          {withAccount && (
            <Input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={t("E-mail da conta Trip Split")} type="email" className="rounded-xl" />
          )}
        </div>
        <Button onClick={add} disabled={busy || !name.trim() || (withAccount && !email.trim())} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> {busy ? t("Salvando…") : t("Adicionar participante")}
        </Button>
      </div>}
      {error && <p className="action-error" role="alert">{error}</p>}

      <div className="border-t border-border/60 pt-5">
        <h2 className="font-semibold text-foreground mb-3">{t('Participantes ({0})', { 0: trip.participants.length })}</h2>
        <div className="space-y-2">
          {trip.participants.map((p) => {
            const removable = canRemove(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 p-2.5 bg-card rounded-2xl border border-border/70">
                <ParticipantAvatar participant={p} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{p.name}</span>
                    {p.hasAccount ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1 shrink-0">
                        <UserCircle2 className="w-3 h-3" /> {t("Conta")} </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{t("Convidado")}</span>
                    )}
                  </div>
                  {p.hasAccount && p.email && <p className="text-[11px] text-muted-foreground truncate">{p.email}</p>}
                </div>
                {canManage && <button
                  onClick={() => removable && remove(p.id)}
                  disabled={!removable || busy}
                  aria-label={t("Remover {0}", { "0": p.name })}
                  title={removable ? t("Remover") : t("Não é possível remover: este participante pagou ou está em despesas.")}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${removable ? 'text-muted-foreground hover:bg-rose-50 hover:text-rose-500' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                >
                  {removable ? <Trash2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </button>}
              </div>
            );
          })}
          {trip.participants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">{t("Nenhum participante ainda.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

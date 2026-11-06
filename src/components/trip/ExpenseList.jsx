import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import ExpenseCard from './ExpenseCard';
import ExpenseFormDialog from './ExpenseFormDialog';
import { useTripStore } from '@/lib/tripStore';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Receipt } from 'lucide-react';

const uid = () => Math.random().toString(36).slice(2, 10);

export default function ExpenseList({ trip, youId }) {
  const { addExpense, updateExpense, deleteExpense } = useTripStore();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const finished = trip.status === 'finished';

  const remove = async (event) => {
    event.preventDefault(); setDeleting(true); setError('');
    try { await deleteExpense(trip.id, confirmDel.id); setConfirmDel(null); }
    catch (deleteError) { setError(deleteError.message); }
    finally { setDeleting(false); }
  };

  const sorted = [...trip.expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const save = async (data) => {
    if (editing) return updateExpense(trip.id, data);
    return addExpense(trip.id, { ...data, id: uid(), createdAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> {t("Despesas")}</h2>
        {!finished && <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4" /> {t("Nova despesa")} </Button>}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-7 h-7" />
          </div>
          <p className="font-medium text-foreground">{t("Nenhuma despesa ainda")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("Toque em \"Nova despesa\" para registrar a primeira.")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((e) => (
            <ExpenseCard
              key={e.id}
              expense={e}
              trip={trip}
              youId={youId}
              canEdit={!finished && (trip.ownerId === user?.id || e.createdBy === user?.id)}
              onEdit={(exp) => { setEditing(exp); setOpen(true); }}
              onDelete={(exp) => setConfirmDel(exp)}
            />
          ))}
        </div>
      )}

      <ExpenseFormDialog open={open} onOpenChange={setOpen} trip={trip} expense={editing} onSave={save} />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && !deleting && setConfirmDel(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Excluir despesa?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('{0} será removida e os saldos recalculados automaticamente.', { 0: confirmDel?.description })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="action-error" role="alert">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Cancelar")}</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={remove} className="bg-rose-500 hover:bg-rose-600 text-white">
              {deleting ? t('Excluindo…') : t("Excluir despesa")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

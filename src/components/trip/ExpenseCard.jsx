import { t } from '@/lib/i18n';
import React from 'react';
import { formatBRL, toCents, formatDate } from '@/lib/format';
import { categoryMeta } from '@/lib/categories';
import CategoryIcon from './CategoryIcon';
import ParticipantAvatar from './ParticipantAvatar';
import { Pencil, Trash2 } from 'lucide-react';

export default function ExpenseCard({ expense, trip, youId, onEdit, onDelete, canEdit = true }) {
  const meta = categoryMeta(expense.category);
  const n = expense.participantIds.length;
  const totalCents = toCents(expense.amount);
  const shareCents = n ? Math.floor(totalCents / n) : 0;
  const payer = trip.participants.find((p) => p.id === expense.paidBy);
  const participants = expense.participantIds.map((id) => trip.participants.find((p) => p.id === id)).filter(Boolean);
  const yourIndex = expense.participantIds.indexOf(youId);
  const yourShare = yourIndex >= 0 ? shareCents + (yourIndex < totalCents % n ? 1 : 0) : null;

  return (
    <div className="bg-card rounded-2xl border border-border/70 p-4 shadow-sm hover:shadow-md transition-shadow fade-in">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}>
          <CategoryIcon name={meta.icon} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{expense.description}</h3>
            <div className="text-right">
              <div className="font-bold text-foreground">{formatBRL(toCents(expense.amount), trip.currency)}</div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="text-xs text-muted-foreground">
              {t(meta.label)} · {formatDate(expense.date)}
            </div>
            <div className="text-[11px] text-muted-foreground">{n} {n === 1 ? t("pessoa") : t("pessoas")}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-muted-foreground shrink-0">{t("Pago por")}</span>
          {payer && <ParticipantAvatar participant={payer} size="xs" />}
          <span className="text-xs font-medium text-foreground truncate">{payer?.name || '—'}</span>
          <div className="flex -space-x-2 ml-1">
            {participants.slice(0, 5).map((p) => (
              <ParticipantAvatar key={p.id} participant={p} size="xs" />
            ))}
            {participants.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-muted text-[10px] flex items-center justify-center font-semibold ring-2 ring-white text-muted-foreground">
                +{participants.length - 5}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {yourShare !== null && (
            <span className="text-[11px] text-muted-foreground mr-1">{t("Sua parte:")} <b className="text-foreground">{formatBRL(yourShare, trip.currency)}</b></span>
          )}
          {canEdit && <><button aria-label={t("Editar {0}", { "0": expense.description })} onClick={() => onEdit(expense)} className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button aria-label={t("Excluir {0}", { "0": expense.description })} onClick={() => onDelete(expense)} className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-rose-50 hover:text-rose-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button></>}
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Plus, PiggyBank, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatXAF } from "@/lib/currency";
import { useTontines, useTontineMembers } from "@/hooks/use-tontines";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateTontineSheet from "./CreateTontineSheet";
import TontineDetailView from "./TontineDetailView";
import type { Tontine } from "@/lib/tontine-types";

/* ─── INLINE TONTINE CARD WITH DOT TIMELINE ─────────────────── */
const TontineListCard = ({ tontine, onTap }: { tontine: Tontine; onTap: () => void }) => {
  const { data: members = [] } = useTontineMembers(tontine.id);
  const potAmount = tontine.contribution_amount * tontine.total_members;
  const myMember = members.find(m => m.is_current_user);
  const isMyTurn = myMember?.position_in_order === tontine.current_cycle;
  const freqLabel = tontine.frequency === "monthly" ? "mois" : "semaine";

  return (
    <button
      onClick={onTap}
      className="w-full text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] animate-fade-in"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold font-display text-sm">{tontine.name}</h3>
          <p className="text-xs text-muted-foreground">
            {formatXAF(tontine.contribution_amount)} / {freqLabel}
          </p>
        </div>
        {isMyTurn && (
          <Badge className="bg-gold text-gold-foreground text-[10px] animate-pulse">
            🎉 Votre tour !
          </Badge>
        )}
        {tontine.status === "completed" && (
          <Badge variant="secondary" className="text-[10px]">Terminée</Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {tontine.total_members} membres
        </span>
        <span className="font-semibold text-gold">Pot : {formatXAF(potAmount)}</span>
      </div>

      {/* Mini dot timeline */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        <span className="text-[10px] text-muted-foreground mr-1">Tour {tontine.current_cycle}/{tontine.total_members}</span>
        <div className="flex items-center gap-1 flex-1">
          {Array.from({ length: tontine.total_members }, (_, i) => {
            const pos = i + 1;
            const isPast = pos < tontine.current_cycle;
            const isCurrent = pos === tontine.current_cycle;
            const isMe = myMember?.position_in_order === pos;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all flex items-center justify-center",
                  isCurrent
                    ? "h-3.5 w-3.5 bg-primary shadow-sm shadow-primary/40 animate-pulse"
                    : isPast
                    ? "h-2.5 w-2.5 bg-muted-foreground/40"
                    : "h-2.5 w-2.5 border border-border bg-card",
                  isMe && !isCurrent && "ring-1 ring-gold"
                )}
              >
                {isMe && <span className="text-[6px]">⭐</span>}
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
};

/* ─── MAIN TONTINES TAB ──────────────────────────────────────── */
const TontinesTab = () => {
  const [selected, setSelected] = useState<Tontine | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { data: tontines = [], isLoading } = useTontines();

  const activeTontines = useMemo(
    () => tontines.filter(t => t.status === "active"),
    [tontines]
  );
  const completedTontines = useMemo(
    () => tontines.filter(t => t.status === "completed"),
    [tontines]
  );

  const totalMonthly = useMemo(() => {
    return activeTontines.reduce((sum, t) => {
      if (t.frequency === "monthly") return sum + t.contribution_amount;
      return sum + t.contribution_amount * 4;
    }, 0);
  }, [activeTontines]);

  const freshSelected = selected ? tontines.find(t => t.id === selected.id) ?? selected : null;

  if (freshSelected) {
    return <TontineDetailView tontine={freshSelected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {/* Summary card */}
      {activeTontines.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold-muted p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="h-4 w-4 text-gold" />
            <span className="text-xs font-semibold text-gold">Mes Tontines</span>
          </div>
          <p className="text-xl font-bold font-display text-gold">{formatXAF(totalMonthly)}<span className="text-xs font-normal text-muted-foreground"> /mois</span></p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {activeTontines.length} tontine{activeTontines.length > 1 ? "s" : ""} active{activeTontines.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : tontines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-muted mb-4">
            <PiggyBank className="h-8 w-8 text-gold" />
          </div>
          <p className="text-sm font-semibold font-display mb-1">Aucune tontine</p>
          <p className="text-xs text-muted-foreground mb-4">Commencez par créer votre première tontine</p>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Créer ma première tontine
          </Button>
        </div>
      ) : (
        <>
          {activeTontines.length > 0 && (
             <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {activeTontines.map(t => (
                <TontineListCard key={t.id} tontine={t} onTap={() => setSelected(t)} />
              ))}
            </div>
          )}

          {completedTontines.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                Terminées
              </p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                {completedTontines.map(t => (
                  <TontineListCard key={t.id} tontine={t} onTap={() => setSelected(t)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg transition-transform active:scale-90"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CreateTontineSheet open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default TontinesTab;

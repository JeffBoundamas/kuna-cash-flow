import { useState, useMemo, useCallback } from "react";
import { Plus, PiggyBank, Users, HandCoins, Gift, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatXAF } from "@/lib/currency";
import { useTontines, useTontineMembers, useTontinePayments, useDeleteTontine } from "@/hooks/use-tontines";
import { useAccounts } from "@/hooks/use-accounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TontineTimeline from "./TontineTimeline";
import CreateTontineSheet from "./CreateTontineSheet";
import LogContributionSheet from "./LogContributionSheet";
import ReceivePotSheet from "./ReceivePotSheet";
import TontineCelebration from "./TontineCelebration";
import type { Tontine } from "@/lib/tontine-types";
import { toast } from "sonner";

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
      <div className="flex items-center gap-1.5">
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

/* ─── TONTINE DETAIL (INLINE) ────────────────────────────────── */
const TontineDetailInline = ({ tontine, onBack }: { tontine: Tontine; onBack: () => void }) => {
  const { data: members = [] } = useTontineMembers(tontine.id);
  const { data: payments = [] } = useTontinePayments(tontine.id);
  const { data: accounts = [] } = useAccounts();
  const deleteTontine = useDeleteTontine();

  const [showContribution, setShowContribution] = useState(false);
  const [showReceivePot, setShowReceivePot] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleCelebrationDone = useCallback(() => setShowCelebration(false), []);

  const myMember = useMemo(() => members.find(m => m.is_current_user), [members]);
  const isMyTurn = myMember && myMember.position_in_order === tontine.current_cycle;
  const potAmount = tontine.contribution_amount * tontine.total_members;

  const myContributions = useMemo(
    () => payments.filter(p => p.type === "contribution"),
    [payments]
  );
  const potReceivedPayments = useMemo(
    () => payments.filter(p => p.type === "pot_received"),
    [payments]
  );
  const totalContributed = useMemo(
    () => myContributions.reduce((s, p) => s + p.amount, 0),
    [myContributions]
  );
  const totalExpected = tontine.contribution_amount * tontine.total_members;
  const contributionPercent = totalExpected > 0 ? Math.min(100, Math.round((totalContributed / totalExpected) * 100)) : 0;

  const accMap = new Map(accounts.map(a => [a.id, a]));

  const myPayoutInfo = useMemo(() => {
    if (!myMember) return null;
    if (myMember.has_received_pot) return "Déjà reçu ✓";
    if (myMember.payout_date) {
      return new Date(myMember.payout_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    }
    return `Position ${myMember.position_in_order}`;
  }, [myMember]);

  const remainingCycles = tontine.total_members - myContributions.length;

  const handleDelete = () => {
    if (!confirm("Supprimer cette tontine ?")) return;
    deleteTontine.mutate(tontine.id, {
      onSuccess: () => {
        toast.success("Tontine supprimée");
        onBack();
      },
    });
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold font-display truncate">{tontine.name}</h1>
          <p className="text-xs text-muted-foreground">
            {tontine.frequency === "monthly" ? "Mensuelle" : "Hebdomadaire"} · Cycle {tontine.current_cycle}/{tontine.total_members}
          </p>
        </div>
        <Badge className={cn(
          "text-[10px]",
          tontine.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {tontine.status === "active" ? "Active" : "Terminée"}
        </Badge>
        <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive p-1.5">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Pot amount hero */}
      <Card className="p-4 text-center border-gold/30 bg-gold-muted">
        <p className="text-xs text-muted-foreground">Pot total</p>
        <p className="text-2xl font-bold font-display text-gold">{formatXAF(potAmount)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {tontine.total_members} × {formatXAF(tontine.contribution_amount)}
        </p>
      </Card>

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold font-display text-muted-foreground mb-2">Ordre de passage</h2>
        <TontineTimeline members={members} currentCycle={tontine.current_cycle} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Versé</p>
          <p className="text-sm font-bold font-display">{formatXAF(totalContributed)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Restant</p>
          <p className="text-sm font-bold font-display">{remainingCycles} tour{remainingCycles > 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Mon tour</p>
          <p className={cn("text-xs font-bold", myMember?.has_received_pot ? "text-primary" : "text-gold")}>
            {myPayoutInfo ?? "—"}
          </p>
        </div>
      </div>

      {/* Progress */}
      {contributionPercent > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Cotisations {contributionPercent}%</span>
            <span>{formatXAF(totalContributed)} / {formatXAF(totalExpected)}</span>
          </div>
          <Progress value={contributionPercent} className="h-2" />
        </div>
      )}

      {/* Action buttons */}
      {tontine.status === "active" && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12" onClick={() => setShowContribution(true)}>
            <HandCoins className="h-4 w-4 mr-2" />
            Cotiser
          </Button>
          <Button
            className="h-12 bg-gold hover:bg-gold/90 text-gold-foreground"
            onClick={() => setShowReceivePot(true)}
            disabled={!isMyTurn || myMember?.has_received_pot}
          >
            <Gift className="h-4 w-4 mr-2" />
            {isMyTurn ? "Pot reçu !" : "Pas mon tour"}
          </Button>
        </div>
      )}

      {/* Payment history */}
      <div>
        <h2 className="text-sm font-semibold font-display text-muted-foreground mb-2">Historique des paiements</h2>
        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Aucun paiement enregistré</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {p.type === "contribution" ? `Cotisation — Cycle ${p.cycle_number}` : "Pot reçu 🎉"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    {p.linked_account_id && accMap.has(p.linked_account_id) && ` · ${accMap.get(p.linked_account_id)!.name}`}
                  </p>
                </div>
                <p className={cn(
                  "text-sm font-semibold",
                  p.type === "contribution" ? "text-destructive" : "text-primary"
                )}>
                  {p.type === "contribution" ? "-" : "+"}{formatXAF(p.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheets */}
      <LogContributionSheet
        open={showContribution}
        onOpenChange={setShowContribution}
        tontineId={tontine.id}
        tontineName={tontine.name}
        amount={tontine.contribution_amount}
        currentCycle={tontine.current_cycle}
      />

      {myMember && (
        <ReceivePotSheet
          open={showReceivePot}
          onOpenChange={setShowReceivePot}
          tontineId={tontine.id}
          tontineName={tontine.name}
          potAmount={potAmount}
          currentCycle={tontine.current_cycle}
          memberId={myMember.id}
          onPotReceived={() => setShowCelebration(true)}
        />
      )}

      <TontineCelebration
        show={showCelebration}
        onDone={handleCelebrationDone}
        potAmount={formatXAF(potAmount)}
      />
    </div>
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

  // Use fresh data for detail view
  const freshSelected = selected ? tontines.find(t => t.id === selected.id) ?? selected : null;

  if (freshSelected) {
    return <TontineDetailInline tontine={freshSelected} onBack={() => setSelected(null)} />;
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
            <div className="space-y-3">
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
              <div className="space-y-3 opacity-60">
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
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg transition-transform active:scale-90"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CreateTontineSheet open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default TontinesTab;

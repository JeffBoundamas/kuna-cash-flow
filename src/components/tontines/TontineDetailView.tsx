import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, Trash2, HandCoins, Gift, TrendingUp, Clock, CalendarCheck, Pencil, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatXAF } from "@/lib/currency";
import { useTontineMembers, useTontinePayments, useDeleteTontine } from "@/hooks/use-tontines";
import { useAccounts } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TontineTimeline from "./TontineTimeline";
import LogContributionSheet from "./LogContributionSheet";
import ReceivePotSheet from "./ReceivePotSheet";
import TontineCelebration from "./TontineCelebration";
import EditTontineSheet from "./EditTontineSheet";
import ManageMembersSheet from "./ManageMembersSheet";
import MemberInfoSheet from "./MemberInfoSheet";
import type { Tontine, TontineMember } from "@/lib/tontine-types";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Props {
  tontine: Tontine;
  onBack: () => void;
}

const TontineDetailView = ({ tontine, onBack }: Props) => {
  const { data: members = [] } = useTontineMembers(tontine.id);
  const { data: payments = [] } = useTontinePayments(tontine.id);
  const { data: accounts = [] } = useAccounts();

  const [showContribution, setShowContribution] = useState(false);
  const [showReceivePot, setShowReceivePot] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TontineMember | null>(null);

  const handleCelebrationDone = useCallback(() => setShowCelebration(false), []);

  const myMember = useMemo(() => members.find(m => m.is_current_user), [members]);
  const isMyTurn = myMember && myMember.position_in_order === tontine.current_cycle;
  const potAmount = tontine.contribution_amount * tontine.total_members;

  const myContributions = useMemo(
    () => payments.filter(p => p.type === "contribution"),
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
    if (!myMember) return { label: "—", sub: "" };
    if (myMember.has_received_pot) return { label: "Déjà reçu ✓", sub: "" };
    if (myMember.payout_date) {
      return {
        label: new Date(myMember.payout_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        sub: `Position ${myMember.position_in_order}`,
      };
    }
    return { label: `Position ${myMember.position_in_order}`, sub: "" };
  }, [myMember]);

  const remainingCycles = tontine.total_members - myContributions.length;

  return (
    <div className="pb-28 space-y-5">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-2">
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
        <button onClick={() => setShowEdit(true)} className="text-muted-foreground hover:text-foreground p-1.5">
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Pot amount hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4"
      >
        <Card className="p-5 text-center border-gold/30 bg-gradient-to-br from-gold-muted to-gold-muted/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gold/5 rounded-full translate-y-6 -translate-x-6" />
          <p className="text-xs text-muted-foreground relative z-10">Pot total</p>
          <p className="text-3xl font-bold font-display text-gold relative z-10">{formatXAF(potAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1 relative z-10">
            {tontine.total_members} × {formatXAF(tontine.contribution_amount)}
          </p>
        </Card>
      </motion.div>

      {/* Timeline */}
      <div className="px-4">
        <h2 className="text-sm font-semibold font-display text-muted-foreground mb-2">Ordre de passage</h2>
        <Card className="p-3 pt-8 border-border/50">
          <TontineTimeline
            members={members}
            currentCycle={tontine.current_cycle}
            onMemberTap={(m) => setSelectedMember(m)}
          />
        </Card>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 gap-2 text-xs text-muted-foreground"
          onClick={() => setShowManageMembers(true)}
        >
          <Users className="h-3.5 w-3.5" />
          Gérer les membres
        </Button>
      </div>

      {/* Stats row */}
      <div className="px-4 grid grid-cols-3 gap-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-3 text-center border-border/50">
            <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Versé</p>
            <p className="text-sm font-bold font-display">{formatXAF(totalContributed)}</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-3 text-center border-border/50">
            <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Restant</p>
            <p className="text-sm font-bold font-display">{remainingCycles} tour{remainingCycles > 1 ? "s" : ""}</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={cn("p-3 text-center border-border/50", myMember?.has_received_pot && "border-primary/30 bg-primary/5")}>
            <CalendarCheck className={cn("h-4 w-4 mx-auto mb-1", myMember?.has_received_pot ? "text-primary" : "text-gold")} />
            <p className="text-[10px] text-muted-foreground">Mon tour</p>
            <p className={cn("text-xs font-bold", myMember?.has_received_pot ? "text-primary" : "text-gold")}>
              {myPayoutInfo.label}
            </p>
            {myPayoutInfo.sub && (
              <p className="text-[9px] text-muted-foreground">{myPayoutInfo.sub}</p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Progress bar */}
      {contributionPercent > 0 && (
        <div className="px-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Cotisations {contributionPercent}%</span>
            <span>{formatXAF(totalContributed)} / {formatXAF(totalExpected)}</span>
          </div>
          <Progress value={contributionPercent} className="h-2" />
        </div>
      )}

      {/* Action buttons */}
      {tontine.status === "active" && (
        <div className="px-4 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 text-sm" onClick={() => setShowContribution(true)}>
            <HandCoins className="h-4 w-4 mr-2" />
            Cotiser
          </Button>
          <Button
            className="h-12 text-sm bg-gold hover:bg-gold/90 text-gold-foreground"
            onClick={() => setShowReceivePot(true)}
            disabled={!isMyTurn || myMember?.has_received_pot}
          >
            <Gift className="h-4 w-4 mr-2" />
            {isMyTurn ? "Pot reçu !" : "Pas mon tour"}
          </Button>
        </div>
      )}

      {/* Payment history */}
      <div className="px-4">
        <h2 className="text-sm font-semibold font-display text-muted-foreground mb-3">Historique des paiements</h2>
        {payments.length === 0 ? (
          <Card className="p-6 text-center border-border/50">
            <p className="text-xs text-muted-foreground">Aucun paiement enregistré</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(
                  "p-3 flex items-center justify-between border-l-3",
                  p.type === "contribution"
                    ? "border-l-destructive/60"
                    : "border-l-primary/60"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                      p.type === "contribution" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    )}>
                      {p.type === "contribution" ? <HandCoins className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.type === "contribution" ? `Cotisation — Cycle ${p.cycle_number}` : "Pot reçu 🎉"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(p.payment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        {p.linked_account_id && accMap.has(p.linked_account_id) && ` · ${accMap.get(p.linked_account_id)!.name}`}
                      </p>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold flex-shrink-0 ml-2",
                    p.type === "contribution" ? "text-destructive" : "text-primary"
                  )}>
                    {p.type === "contribution" ? "-" : "+"}{formatXAF(p.amount)}
                  </p>
                </Card>
              </motion.div>
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

      <EditTontineSheet
        open={showEdit}
        onOpenChange={setShowEdit}
        tontine={tontine}
        onDeleted={onBack}
      />

      <ManageMembersSheet
        open={showManageMembers}
        onOpenChange={setShowManageMembers}
        tontine={tontine}
      />

      <MemberInfoSheet
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
        member={selectedMember}
        onAddPhone={() => {
          setSelectedMember(null);
          setShowManageMembers(true);
        }}
      />
    </div>
  );
};

export default TontineDetailView;

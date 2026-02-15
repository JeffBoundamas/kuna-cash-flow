import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, HandCoins, Gift, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTontine, useTontineMembers, useTontinePayments, useDeleteTontine } from "@/hooks/use-tontines";
import TontineTimeline from "@/components/tontines/TontineTimeline";
import LogContributionSheet from "@/components/tontines/LogContributionSheet";
import ReceivePotSheet from "@/components/tontines/ReceivePotSheet";
import TontineCelebration from "@/components/tontines/TontineCelebration";
import { formatXAF } from "@/lib/currency";
import { toast } from "sonner";

const TontineDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tontine, isLoading: loadingTontine } = useTontine(id ?? "");
  const { data: members = [], isLoading: loadingMembers } = useTontineMembers(id ?? "");
  const { data: payments = [] } = useTontinePayments(id ?? "");
  const deleteTontine = useDeleteTontine();

  const [showContribution, setShowContribution] = useState(false);
  const [showReceivePot, setShowReceivePot] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleCelebrationDone = useCallback(() => setShowCelebration(false), []);

  const isLoading = loadingTontine || loadingMembers;

  const myMember = useMemo(() => members.find((m) => m.is_current_user), [members]);
  const isMyTurn = myMember && myMember.position_in_order === tontine?.current_cycle;
  const potAmount = (tontine?.contribution_amount ?? 0) * (tontine?.total_members ?? 0);

  const myContributions = useMemo(
    () => payments.filter((p) => p.type === "contribution"),
    [payments]
  );

  const totalContributed = useMemo(
    () => myContributions.reduce((sum, p) => sum + p.amount, 0),
    [myContributions]
  );

  const totalExpected = (tontine?.contribution_amount ?? 0) * (tontine?.total_members ?? 0);

  const handleDelete = () => {
    if (!id) return;
    deleteTontine.mutate(id, {
      onSuccess: () => {
        toast.success("Tontine supprimée");
        navigate("/tontines");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-muted-foreground">Tontine introuvable</p>
        <Button variant="ghost" onClick={() => navigate("/tontines")} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/tontines")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold font-display">{tontine.name}</h1>
          <p className="text-xs text-muted-foreground">
            {tontine.frequency === "monthly" ? "Mensuelle" : "Hebdomadaire"} • Cycle {tontine.current_cycle}/{tontine.total_members}
          </p>
        </div>
        <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive p-2">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Pot amount */}
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

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12"
          onClick={() => setShowContribution(true)}
        >
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

      {/* My contributions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold font-display text-muted-foreground">Mes cotisations</h2>
          <span className="text-xs text-muted-foreground">
            {formatXAF(totalContributed)} / {formatXAF(totalExpected)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, totalExpected > 0 ? (totalContributed / totalExpected) * 100 : 0)}%` }}
          />
        </div>

        {myContributions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucune cotisation enregistrée</p>
        ) : (
          <div className="space-y-2">
            {myContributions.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">Cycle {p.cycle_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-destructive">-{formatXAF(p.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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

export default TontineDetailPage;

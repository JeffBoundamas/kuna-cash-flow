import { useState } from "react";
import { ArrowLeft, Ban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useObligationPayments, useCancelObligation } from "@/hooks/use-obligations";
import { useAccounts } from "@/hooks/use-accounts";
import { toast } from "@/hooks/use-toast";
import LogObligationPaymentSheet from "./LogObligationPaymentSheet";
import type { Obligation } from "@/lib/obligation-types";

interface Props {
  obligation: Obligation;
  onBack: () => void;
}

const confidenceLabels: Record<string, string> = {
  certain: "Certain",
  probable: "Probable",
  uncertain: "Incertain",
};

const statusLabels: Record<string, string> = {
  active: "Actif",
  partially_paid: "Partiellement payé",
  settled: "Réglé",
  cancelled: "Annulé",
};

const ObligationDetail = ({ obligation: ob, onBack }: Props) => {
  const [showPayment, setShowPayment] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { data: payments = [] } = useObligationPayments(ob.id);
  const { data: accounts = [] } = useAccounts();
  const cancelOb = useCancelObligation();
  const isCreance = ob.type === "creance";

  const accMap = new Map(accounts.map(a => [a.id, a]));
  const paidPercent = ob.total_amount > 0
    ? Math.round(((ob.total_amount - ob.remaining_amount) / ob.total_amount) * 100)
    : 0;

  const handleCancel = async () => {
    if (!confirm("Annuler cette obligation ?")) return;
    try {
      await cancelOb.mutateAsync(ob.id);
      toast({ title: "Obligation annulée" });
      onBack();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold font-display truncate">{ob.person_name}</h1>
      </div>

      {/* Info card */}
      <div className={cn(
        "rounded-xl border p-4 space-y-3",
        isCreance ? "border-l-4 border-l-emerald-500 border-border" : "border-l-4 border-l-destructive border-border"
      )}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground">{isCreance ? "On me doit" : "Je dois"}</p>
            <p className={cn(
              "text-2xl font-bold font-display",
              isCreance ? "text-emerald-600" : "text-destructive"
            )}>
              {formatXAF(ob.remaining_amount)}
            </p>
            {ob.remaining_amount !== ob.total_amount && (
              <p className="text-xs text-muted-foreground">sur {formatXAF(ob.total_amount)}</p>
            )}
          </div>
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            ob.status === "settled" ? "bg-emerald-100 text-emerald-700" :
            ob.status === "cancelled" ? "bg-muted text-muted-foreground" :
            "bg-primary/10 text-primary"
          )}>
            {statusLabels[ob.status]}
          </span>
        </div>

        {ob.description && <p className="text-sm text-muted-foreground">{ob.description}</p>}

        {ob.due_date && (
          <p className="text-xs text-muted-foreground">
            Échéance : {new Date(ob.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        {isCreance && (
          <p className="text-xs text-muted-foreground">
            Certitude : {confidenceLabels[ob.confidence]}
          </p>
        )}

        {paidPercent > 0 && paidPercent < 100 && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Remboursé {paidPercent}%</span>
              <span>{formatXAF(ob.total_amount - ob.remaining_amount)} / {formatXAF(ob.total_amount)}</span>
            </div>
            <Progress value={paidPercent} className="h-2" />
          </div>
        )}
      </div>

      {/* Actions */}
      {ob.status !== "settled" && ob.status !== "cancelled" && (
        <div className="flex gap-2">
          <Button onClick={() => setShowPayment(true)} className="flex-1 gap-1.5">
            <Plus className="h-4 w-4" />
            Enregistrer un paiement
          </Button>
          <Button variant="outline" onClick={handleCancel} size="icon" className="shrink-0">
            <Ban className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-3">
            <p className="text-5xl">🎉</p>
            <p className="text-xl font-bold font-display">Obligation réglée !</p>
            <p className="text-sm text-muted-foreground">{ob.person_name}</p>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div>
        <h2 className="text-sm font-semibold font-display text-muted-foreground mb-2">
          Historique des paiements
        </h2>
        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Aucun paiement enregistré</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{formatXAF(p.amount)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    {p.account_id && accMap.has(p.account_id) && ` · ${accMap.get(p.account_id)!.name}`}
                  </p>
                  {p.notes && <p className="text-[11px] text-muted-foreground italic mt-0.5">{p.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LogObligationPaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        obligation={ob}
        onSettled={() => {
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            onBack();
          }, 3000);
        }}
      />
    </div>
  );
};

export default ObligationDetail;

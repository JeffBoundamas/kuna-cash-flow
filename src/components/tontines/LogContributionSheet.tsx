import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLogContribution } from "@/hooks/use-tontines";
import { useCreateNotification } from "@/hooks/use-notifications";
import { useActivePaymentMethodsWithBalance, checkBalanceSufficiency } from "@/hooks/use-payment-methods-with-balance";
import PaymentMethodPicker from "@/components/payment-methods/PaymentMethodPicker";
import { formatXAF } from "@/lib/currency";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tontineId: string;
  tontineName: string;
  amount: number;
  currentCycle: number;
  totalMembers?: number;
}

const LogContributionSheet = ({ open, onOpenChange, tontineId, tontineName, amount, currentCycle, totalMembers }: Props) => {
  const { data: paymentMethods = [] } = useActivePaymentMethodsWithBalance();
  const [pmId, setPmId] = useState("");
  const logContribution = useLogContribution();
  const createNotification = useCreateNotification();

  const handleSubmit = () => {
    const selectedPM = pmId || paymentMethods[0]?.id;
    if (!selectedPM) {
      toast.error("Choisissez un moyen de paiement");
      return;
    }

    // Balance validation
    const pm = paymentMethods.find((p) => p.id === selectedPM);
    if (pm) {
      const err = checkBalanceSufficiency(pm, -amount);
      if (err) {
        toast.error(err);
        return;
      }
    }

    logContribution.mutate(
      {
        tontine_id: tontineId,
        amount,
        cycle_number: currentCycle,
        linked_account_id: selectedPM,
        tontine_name: tontineName,
      },
      {
        onSuccess: () => {
          const toastMsg = `Cotisation de ${formatXAF(amount)} enregistrée pour ${tontineName} — Tour ${currentCycle}/${totalMembers ?? "?"}`;
          toast.success(toastMsg);
          createNotification.mutate({
            type: "cotisation_logged",
            title: "Cotisation enregistrée",
            body: toastMsg,
            related_tontine_id: tontineId,
          });
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur"),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Enregistrer ma cotisation</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Montant de la cotisation</p>
            <p className="text-xl font-bold font-display">{formatXAF(amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cycle {currentCycle} • {tontineName}</p>
          </div>

          <PaymentMethodPicker
            methods={paymentMethods}
            selectedId={pmId || paymentMethods[0]?.id || ""}
            onSelect={setPmId}
            label="Depuis quel compte ?"
          />

          <Button className="w-full" onClick={handleSubmit} disabled={logContribution.isPending}>
            Enregistrer la cotisation
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LogContributionSheet;

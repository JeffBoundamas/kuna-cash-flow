import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useReceivePot } from "@/hooks/use-tontines";
import { useCreateNotification } from "@/hooks/use-notifications";
import { useActivePaymentMethodsWithBalance } from "@/hooks/use-payment-methods-with-balance";
import PaymentMethodPicker from "@/components/payment-methods/PaymentMethodPicker";
import { formatXAF } from "@/lib/currency";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tontineId: string;
  tontineName: string;
  potAmount: number;
  currentCycle: number;
  memberId: string;
  onPotReceived?: () => void;
}

const ReceivePotSheet = ({ open, onOpenChange, tontineId, tontineName, potAmount, currentCycle, memberId, onPotReceived }: Props) => {
  const { data: paymentMethods = [] } = useActivePaymentMethodsWithBalance();
  const [pmId, setPmId] = useState("");
  const receivePot = useReceivePot();
  const createNotification = useCreateNotification();

  const handleSubmit = () => {
    const selectedPM = pmId || paymentMethods[0]?.id;
    if (!selectedPM) {
      toast.error("Choisissez un moyen de paiement");
      return;
    }
    receivePot.mutate(
      {
        tontine_id: tontineId,
        amount: potAmount,
        cycle_number: currentCycle,
        payment_method_id: selectedPM,
        tontine_name: tontineName,
        member_id: memberId,
      },
      {
        onSuccess: () => {
          const msg = `Félicitations ! Vous avez reçu le pot de ${formatXAF(potAmount)} !`;
          toast.success(`🎉 ${msg}`);
          createNotification.mutate({
            type: "pot_received",
            title: "Pot reçu !",
            body: msg,
            related_tontine_id: tontineId,
          });
          onOpenChange(false);
          onPotReceived?.();
        },
        onError: () => toast.error("Erreur"),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>🎉 J'ai reçu le pot !</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl bg-gold-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Montant du pot</p>
            <p className="text-2xl font-bold font-display text-gold">{formatXAF(potAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{tontineName}</p>
          </div>

          <PaymentMethodPicker
            methods={paymentMethods}
            selectedId={pmId || paymentMethods[0]?.id || ""}
            onSelect={setPmId}
            label="Sur quel compte l'avez-vous reçu ?"
          />

          <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground" onClick={handleSubmit} disabled={receivePot.isPending}>
            Confirmer la réception
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReceivePotSheet;

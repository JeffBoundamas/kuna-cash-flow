import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogObligationPayment } from "@/hooks/use-obligations";
import { useActivePaymentMethodsWithBalance, checkBalanceSufficiency } from "@/hooks/use-payment-methods-with-balance";
import PaymentMethodPicker from "@/components/payment-methods/PaymentMethodPicker";
import { toast } from "@/hooks/use-toast";
import { formatXAF } from "@/lib/currency";
import type { Obligation } from "@/lib/obligation-types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  obligation: Obligation | null;
  onSettled?: () => void;
}

const LogObligationPaymentSheet = ({ open, onOpenChange, obligation, onSettled }: Props) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [pmId, setPmId] = useState("");
  const [notes, setNotes] = useState("");
  const { data: paymentMethods = [] } = useActivePaymentMethodsWithBalance();
  const logPayment = useLogObligationPayment();

  const handleOpen = (v: boolean) => {
    if (v && obligation) {
      setAmount(String(obligation.remaining_amount));
      setDate(new Date().toISOString().slice(0, 10));
      setPmId(paymentMethods[0]?.id || "");
      setNotes("");
    }
    onOpenChange(v);
  };

  const handleSave = async () => {
    const selectedPM = pmId || paymentMethods[0]?.id;
    if (!obligation || !selectedPM) return;
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0 || numAmount > obligation.remaining_amount) {
      toast({ title: "Montant invalide", variant: "destructive" });
      return;
    }

    // Balance validation for engagement (outgoing) payments
    if (obligation.type === "engagement") {
      const pm = paymentMethods.find((p) => p.id === selectedPM);
      if (pm) {
        const err = checkBalanceSufficiency(pm, -numAmount);
        if (err) {
          toast({ title: "Solde insuffisant", description: err, variant: "destructive" });
          return;
        }
      }
    }

    try {
      const result = await logPayment.mutateAsync({
        obligation,
        amount: numAmount,
        payment_date: date,
        account_id: selectedPM,
        notes: notes.trim() || undefined,
      });
      toast({
        title: result.settled ? "Obligation réglée ! 🎉" : "Paiement enregistré",
      });
      if (result.settled && onSettled) onSettled();
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  if (!obligation) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Enregistrer un paiement</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Restant dû : <strong>{formatXAF(obligation.remaining_amount)}</strong>
          </p>

          <div>
            <Label>Montant (FCFA)</Label>
            <Input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div>
            <Label>Date du paiement</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <PaymentMethodPicker
            methods={paymentMethods}
            selectedId={pmId || paymentMethods[0]?.id || ""}
            onSelect={setPmId}
            label="Compte utilisé"
          />

          <div>
            <Label>Notes (optionnel)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails..." />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={logPayment.isPending}>
            {logPayment.isPending ? "Enregistrement..." : "Confirmer le paiement"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LogObligationPaymentSheet;

import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObligations, useLogObligationPayment } from "@/hooks/use-obligations";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { toast } from "sonner";
import { formatXAF } from "@/lib/currency";
import type { FixedCharge } from "@/lib/fixed-charge-types";

interface Props {
  charge: FixedCharge | null;
  onClose: () => void;
}

const PayFixedChargeSheet = ({ charge, onClose }: Props) => {
  const { data: obligations = [] } = useObligations();
  const { data: methods = [] } = usePaymentMethods();
  const logPayment = useLogObligationPayment();
  const [pmId, setPmId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  // Find the matching obligation for this charge in the current period
  const matchingObligation = useMemo(() => {
    if (!charge) return null;
    const now = new Date();
    return obligations.find(o => {
      if ((o as any).linked_fixed_charge_id !== charge.id) return false;
      if (o.status === "settled" || o.status === "cancelled") return false;
      if (!o.due_date) return false;
      const d = new Date(o.due_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }) ?? null;
  }, [charge, obligations]);

  useEffect(() => {
    if (charge?.payment_method_id) setPmId(charge.payment_method_id);
    setPayDate(new Date().toISOString().slice(0, 10));
  }, [charge]);

  const handlePay = () => {
    if (!charge || !matchingObligation || !pmId) {
      toast.error("Veuillez sélectionner un moyen de paiement");
      return;
    }

    // Find account linked to payment method
    const method = methods.find(m => m.id === pmId);
    if (!method) return;

    // We need an account_id - use the first account available
    // The obligation payment hook handles the transaction creation
    logPayment.mutate({
      obligation: matchingObligation,
      amount: matchingObligation.remaining_amount,
      payment_date: payDate,
      account_id: pmId, // payment method acts as account
      notes: `Paiement ${charge.name} — ${new Date(payDate).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
    }, {
      onSuccess: () => {
        toast.success(`${charge.name} payé !`);
        onClose();
      },
      onError: (err: any) => toast.error(err.message || "Erreur"),
    });
  };

  if (!charge) return null;

  return (
    <Sheet open={!!charge} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle className="font-display">Payer {charge.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Montant</p>
            <p className="text-2xl font-bold font-display text-primary">{formatXAF(charge.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{charge.beneficiary}</p>
          </div>

          {!matchingObligation && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Aucun engagement trouvé pour cette période. Le paiement sera enregistré directement.
              </p>
            </div>
          )}

          <div>
            <Label>Moyen de paiement</Label>
            <Select value={pmId} onValueChange={setPmId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {methods.filter(m => m.is_active).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date de paiement</Label>
            <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
          </div>

          <Button
            onClick={handlePay}
            className="w-full"
            disabled={logPayment.isPending || !matchingObligation}
          >
            {logPayment.isPending ? "Paiement..." : "Confirmer le paiement"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PayFixedChargeSheet;

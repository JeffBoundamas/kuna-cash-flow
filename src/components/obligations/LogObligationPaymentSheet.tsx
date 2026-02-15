import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogObligationPayment } from "@/hooks/use-obligations";
import { useAccounts } from "@/hooks/use-accounts";
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
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const { data: accounts = [] } = useAccounts();
  const logPayment = useLogObligationPayment();

  const handleOpen = (v: boolean) => {
    if (v && obligation) {
      setAmount(String(obligation.remaining_amount));
      setDate(new Date().toISOString().slice(0, 10));
      setAccountId(accounts[0]?.id || "");
      setNotes("");
    }
    onOpenChange(v);
  };

  const handleSave = async () => {
    if (!obligation || !accountId) return;
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0 || numAmount > obligation.remaining_amount) {
      toast({ title: "Montant invalide", variant: "destructive" });
      return;
    }
    try {
      const result = await logPayment.mutateAsync({
        obligation,
        amount: numAmount,
        payment_date: date,
        account_id: accountId,
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
            <Input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <Label>Date du paiement</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label>Compte utilisé</Label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
            >
              <option value="">Sélectionner...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

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

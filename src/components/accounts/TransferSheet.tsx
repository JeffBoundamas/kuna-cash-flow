import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import CalculatorKeypad from "@/components/transactions/CalculatorKeypad";

interface TransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransferSheet = ({ open, onOpenChange }: TransferSheetProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!fromId || !toId || !amount || fromId === toId || !user) {
      toast({ title: "Sélectionnez deux comptes différents et un montant", variant: "destructive" });
      return;
    }

    const numAmount = parseInt(amount);
    if (numAmount <= 0) return;

    const fromAcc = accounts.find((a) => a.id === fromId);
    const toAcc = accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc) return;

    if (fromAcc.balance < numAmount) {
      toast({ title: "Solde insuffisant", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Debit source
      await supabase
        .from("accounts")
        .update({ balance: fromAcc.balance - numAmount })
        .eq("id", fromId);

      // Credit destination
      await supabase
        .from("accounts")
        .update({ balance: toAcc.balance + numAmount })
        .eq("id", toId);

      qc.invalidateQueries({ queryKey: ["accounts"] });

      toast({
        title: "Transfert effectué ✓",
        description: `${formatXAF(numAmount)} de ${fromAcc.name} vers ${toAcc.name}`,
      });
      setAmount("");
      setFromId("");
      setToId("");
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur lors du transfert", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-display flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfert interne
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* From account */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Compte source
            </label>
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setFromId(acc.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                    fromId === acc.id
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {acc.name}
                  <span className="block text-[10px] opacity-70">{formatXAF(acc.balance)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* To account */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Compte destination
            </label>
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {accounts
                .filter((a) => a.id !== fromId)
                .map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setToId(acc.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                      toId === acc.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {acc.name}
                    <span className="block text-[10px] opacity-70">{formatXAF(acc.balance)}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Amount */}
          <CalculatorKeypad value={amount} onChange={setAmount} />

          <Button
            onClick={handleTransfer}
            disabled={loading || !amount || !fromId || !toId}
            className="w-full rounded-xl py-6 text-base font-semibold"
            size="lg"
          >
            {loading ? "Transfert..." : "Transférer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransferSheet;

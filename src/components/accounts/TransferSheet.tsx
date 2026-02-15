import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, icons } from "lucide-react";
import { useActivePaymentMethodsWithBalance, checkBalanceSufficiency } from "@/hooks/use-payment-methods-with-balance";
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
  const { data: paymentMethods = [] } = useActivePaymentMethodsWithBalance();
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

    const fromPM = paymentMethods.find((p) => p.id === fromId);
    if (!fromPM) return;

    // Balance validation on source
    const err = checkBalanceSufficiency(fromPM, -numAmount);
    if (err) {
      toast({ title: "Solde insuffisant", description: err, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Find or create transfer category
      let { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Transfert interne")
        .maybeSingle();

      if (!cat) {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ user_id: user.id, name: "Transfert interne", type: "Expense" as const, nature: "Essential" as const, color: "gray" })
          .select("id")
          .single();
        cat = newCat;
      }

      if (cat) {
        // Debit transaction
        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: fromId,
          payment_method_id: fromId,
          category_id: cat.id,
          amount: -numAmount,
          label: `Transfert vers ${paymentMethods.find(p => p.id === toId)?.name || ""}`,
        });

        // Credit transaction
        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: toId,
          payment_method_id: toId,
          category_id: cat.id,
          amount: numAmount,
          label: `Transfert depuis ${fromPM.name}`,
        });
      }

      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["payment_methods"] });

      toast({
        title: "Transfert effectué ✓",
        description: `${formatXAF(numAmount)} de ${fromPM.name} vers ${paymentMethods.find(p => p.id === toId)?.name || ""}`,
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

  const renderChips = (selected: string, onSelect: (id: string) => void, exclude?: string, variant: "destructive" | "primary" = "primary") => (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
      {paymentMethods
        .filter((p) => !exclude || p.id !== exclude)
        .map((pm) => {
          const Icon = (icons as any)[pm.icon] || (icons as any)["Wallet"];
          return (
            <button
              key={pm.id}
              onClick={() => onSelect(pm.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2",
                selected === pm.id
                  ? variant === "destructive"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0"
                style={{ backgroundColor: pm.color + "20" }}>
                <Icon className="h-3 w-3" style={{ color: pm.color }} />
              </div>
              <div className="text-left">
                <span className="block leading-tight">{pm.name}</span>
                <span className="block text-[10px] opacity-70">{formatXAF(pm.currentBalance)}</span>
              </div>
            </button>
          );
        })}
    </div>
  );

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
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Compte source</label>
            {renderChips(fromId, setFromId, undefined, "destructive")}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Compte destination</label>
            {renderChips(toId, setToId, fromId)}
          </div>

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

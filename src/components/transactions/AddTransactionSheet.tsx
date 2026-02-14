import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useAddTransaction } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface AddTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTransactionSheet = ({ open, onOpenChange }: AddTransactionSheetProps) => {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const addTransaction = useAddTransaction();

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "Income" : c.type === "Expense"
  );

  const handleSubmit = async () => {
    const selectedAccount = accountId || accounts[0]?.id;
    if (!amount || !categoryId || !selectedAccount) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    const numAmount = parseInt(amount);
    const finalAmount = type === "expense" ? -Math.abs(numAmount) : Math.abs(numAmount);

    try {
      await addTransaction.mutateAsync({
        account_id: selectedAccount,
        category_id: categoryId,
        amount: finalAmount,
        label: label || "Transaction",
        sms_reference: note || undefined,
      });
      toast({
        title: "Transaction ajoutée ✓",
        description: `${label || "Transaction"} — ${amount} XAF`,
      });
      setAmount("");
      setLabel("");
      setCategoryId("");
      setNote("");
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-display">Nouvelle Transaction</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Type toggle */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => { setType("expense"); setCategoryId(""); }}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                type === "expense"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Dépense
            </button>
            <button
              onClick={() => { setType("income"); setCategoryId(""); }}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                type === "income"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Revenu
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Montant (XAF) *
            </label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-2xl font-bold font-display focus:outline-none focus:ring-2 focus:ring-ring text-center"
            />
          </div>

          {/* Label */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Libellé
            </label>
            <input
              type="text"
              placeholder="Ex: Marché du samedi"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Account */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Compte
            </label>
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ajoutez d'abord un compte depuis le tableau de bord.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                      (accountId || accounts[0]?.id) === acc.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Catégorie *
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    categoryId === cat.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Note / SMS */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Note / SMS MoMo
            </label>
            <textarea
              placeholder="Collez un SMS MoMo pour extraction automatique..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={addTransaction.isPending}
            className="w-full rounded-xl py-6 text-base font-semibold"
            size="lg"
          >
            {addTransaction.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddTransactionSheet;

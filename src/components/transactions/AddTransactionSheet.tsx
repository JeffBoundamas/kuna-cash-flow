import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useAddTransaction, useAllTransactions } from "@/hooks/use-transactions";
import { useCategorySuggestion } from "@/hooks/use-category-suggestion";
import { useAddRecurringTransaction, type RecurringFrequency } from "@/hooks/use-recurring-transactions";
import CategoryListPicker from "@/components/transactions/CategoryListPicker";
import RecurringToggle from "@/components/transactions/RecurringToggle";
import InsufficientBalanceModal from "@/components/InsufficientBalanceModal";
import { canDebitAccount } from "@/lib/balance-validation";
import { formatXAF } from "@/lib/currency";
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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [balanceError, setBalanceError] = useState<{ accountName: string; currentBalance: number; requestedAmount: number } | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const addTransaction = useAddTransaction();
  const addRecurring = useAddRecurringTransaction();

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "Income" : c.type === "Expense"
  );

  const suggestedCategoryId = useCategorySuggestion(label, categories, allTransactions, type);

  useEffect(() => {
    if (suggestedCategoryId && !categoryId) {
      setCategoryId(suggestedCategoryId);
    }
  }, [suggestedCategoryId]);

  const numAmount = parseInt(amount) || 0;

  const handleSubmit = async () => {
    const selectedAccount = accountId || accounts[0]?.id;
    if (!amount || !categoryId || !selectedAccount) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    const finalAmount = type === "expense" ? -Math.abs(numAmount) : Math.abs(numAmount);

    // Balance check for expenses
    if (type === "expense" && numAmount > 0) {
      const check = await canDebitAccount(selectedAccount, numAmount);
      if (!check.allowed) {
        setBalanceError({ accountName: check.accountName, currentBalance: check.currentBalance, requestedAmount: numAmount });
        return;
      }
    }

    try {
      await addTransaction.mutateAsync({
        account_id: selectedAccount,
        category_id: categoryId,
        amount: finalAmount,
        label: label || "Transaction",
        date: date,
        sms_reference: note || undefined,
      });

      if (isRecurring) {
        await addRecurring.mutateAsync({
          account_id: selectedAccount,
          category_id: categoryId,
          amount: finalAmount,
          label: label || "Transaction",
          frequency,
        });
      }

      toast({
        title: "Transaction ajoutée ✓",
        description: `${label || "Transaction"} — ${amount} XAF`,
      });
      setAmount("");
      setLabel("");
      setCategoryId("");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      setIsRecurring(false);
      setFrequency("monthly");
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  };

  return (
    <>
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
                  type === "expense" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Dépense
              </button>
              <button
                onClick={() => { setType("income"); setCategoryId(""); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  type === "income" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Revenu
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Montant (XAF) *</label>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Libellé</label>
              <input
                type="text"
                placeholder="Ex: Marché du samedi"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Account with balance indicators */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Compte</label>
              {accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ajoutez d'abord un compte depuis le tableau de bord.</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {accounts.map((acc) => {
                    const insufficientForExpense = type === "expense" && numAmount > 0 && acc.balance < numAmount;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => !insufficientForExpense && setAccountId(acc.id)}
                        disabled={insufficientForExpense}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                          insufficientForExpense
                            ? "border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                            : (accountId || accounts[0]?.id) === acc.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground"
                        )}
                      >
                        {acc.name}
                        <span className="block text-[10px] opacity-70">{formatXAF(acc.balance)}</span>
                        {insufficientForExpense && (
                          <span className="block text-[10px] text-destructive font-medium">Solde insuffisant</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Catégorie *</label>
              <CategoryListPicker
                categories={filteredCategories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                suggestedId={suggestedCategoryId}
              />
            </div>

            {/* Note / SMS */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Note / SMS MoMo</label>
              <textarea
                placeholder="Collez un SMS MoMo pour extraction automatique..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Recurring */}
            <RecurringToggle
              enabled={isRecurring}
              onToggle={setIsRecurring}
              frequency={frequency}
              onFrequencyChange={setFrequency}
            />

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

      <InsufficientBalanceModal
        open={!!balanceError}
        onOpenChange={() => setBalanceError(null)}
        accountName={balanceError?.accountName ?? ""}
        currentBalance={balanceError?.currentBalance ?? 0}
        requestedAmount={balanceError?.requestedAmount ?? 0}
        onChooseAnother={() => setBalanceError(null)}
      />
    </>
  );
};

export default AddTransactionSheet;

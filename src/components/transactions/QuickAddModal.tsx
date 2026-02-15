import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useAddTransaction } from "@/hooks/use-transactions";
import { useAddRecurringTransaction, type RecurringFrequency } from "@/hooks/use-recurring-transactions";
import InsufficientBalanceModal from "@/components/InsufficientBalanceModal";
import { canDebitAccount } from "@/lib/balance-validation";
import { formatXAF } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import CalculatorKeypad from "./CalculatorKeypad";
import CategoryListPicker from "./CategoryListPicker";
import RecurringToggle from "./RecurringToggle";

const STORAGE_KEY = "quickadd_defaults";

function getDefaults(): { categoryId: string; accountId: string; type: "expense" | "income" } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { categoryId: "", accountId: "", type: "expense" };
}

function saveDefaults(data: { categoryId: string; accountId: string; type: "expense" | "income" }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickAddModal = ({ open, onOpenChange }: QuickAddModalProps) => {
  const defaults = getDefaults();
  const [type, setType] = useState<"expense" | "income">(defaults.type);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [accountId, setAccountId] = useState(defaults.accountId);
  const [categoryId, setCategoryId] = useState(defaults.categoryId);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [balanceError, setBalanceError] = useState<{ accountName: string; currentBalance: number; requestedAmount: number } | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const addTransaction = useAddTransaction();
  const addRecurring = useAddRecurringTransaction();

  const filteredCategories = useMemo(
    () => categories.filter((c) => (type === "income" ? c.type === "Income" : c.type === "Expense")),
    [categories, type]
  );

  const numAmount = parseInt(amount) || 0;

  useEffect(() => {
    if (open) {
      const d = getDefaults();
      setType(d.type);
      setAccountId(d.accountId);
      setCategoryId(d.categoryId);
      setAmount("");
      setLabel("");
      setIsRecurring(false);
      setFrequency("monthly");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  useEffect(() => {
    if (accountId && accounts.length > 0 && !accounts.find((a) => a.id === accountId)) {
      setAccountId(accounts[0]?.id || "");
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (categoryId && filteredCategories.length > 0 && !filteredCategories.find((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [filteredCategories, categoryId]);

  const handleSubmit = async () => {
    const selectedAccount = accountId || accounts[0]?.id;
    if (!amount || !categoryId || !selectedAccount) {
      toast({ title: "Remplissez montant, catégorie et compte", variant: "destructive" });
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

      saveDefaults({ categoryId, accountId: selectedAccount, type });

      toast({
        title: "Transaction ajoutée ✓",
        description: `${label || "Transaction"} — ${parseInt(amount).toLocaleString("fr-FR")} XAF`,
      });
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto p-4 gap-3">
          <DialogHeader className="pb-0">
            <DialogTitle className="font-display text-base">Ajout rapide</DialogTitle>
          </DialogHeader>

          {/* Type toggle */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => { setType("expense"); setCategoryId(""); }}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-sm font-medium transition-all",
                type === "expense" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Dépense
            </button>
            <button
              onClick={() => { setType("income"); setCategoryId(""); }}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-sm font-medium transition-all",
                type === "income" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Revenu
            </button>
          </div>

          {/* Calculator */}
          <CalculatorKeypad value={amount} onChange={setAmount} />

          {/* Label */}
          <input
            type="text"
            placeholder="Libellé (optionnel)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Date */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Account chips with balance */}
          {accounts.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {accounts.map((acc) => {
                const insufficientForExpense = type === "expense" && numAmount > 0 && acc.balance < numAmount;
                return (
                  <button
                    key={acc.id}
                    onClick={() => !insufficientForExpense && setAccountId(acc.id)}
                    disabled={insufficientForExpense}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
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

          {/* Category picker */}
          <CategoryListPicker
            categories={filteredCategories}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />

          {/* Recurring toggle */}
          <RecurringToggle
            enabled={isRecurring}
            onToggle={setIsRecurring}
            frequency={frequency}
            onFrequencyChange={setFrequency}
          />

          <Button
            onClick={handleSubmit}
            disabled={addTransaction.isPending || !amount}
            className="w-full rounded-xl py-5 text-base font-semibold"
            size="lg"
          >
            {addTransaction.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogContent>
      </Dialog>

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

export default QuickAddModal;

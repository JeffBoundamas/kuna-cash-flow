import { useState, useEffect, useMemo } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useAddTransaction, useAllTransactions } from "@/hooks/use-transactions";
import { useCategorySuggestion } from "@/hooks/use-category-suggestion";
import { useAddRecurringTransaction, type RecurringFrequency } from "@/hooks/use-recurring-transactions";
import { useActivePaymentMethodsWithBalance, checkBalanceSufficiency } from "@/hooks/use-payment-methods-with-balance";
import PaymentMethodPicker from "@/components/payment-methods/PaymentMethodPicker";
import CategoryListPicker from "@/components/transactions/CategoryListPicker";
import RecurringToggle from "@/components/transactions/RecurringToggle";
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
  const [pmId, setPmId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");

  const { data: paymentMethods = [] } = useActivePaymentMethodsWithBalance();
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

  // Auto-select first PM
  useEffect(() => {
    if (paymentMethods.length > 0 && !pmId) {
      setPmId(paymentMethods[0].id);
    }
  }, [paymentMethods, pmId]);

  const handleSubmit = async () => {
    const selectedPM = pmId || paymentMethods[0]?.id;
    if (!amount || !categoryId || !selectedPM) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    const numAmount = parseInt(amount);
    const finalAmount = type === "expense" ? -Math.abs(numAmount) : Math.abs(numAmount);

    // Balance validation
    const pm = paymentMethods.find((p) => p.id === selectedPM);
    if (pm && finalAmount < 0) {
      const err = checkBalanceSufficiency(pm, finalAmount);
      if (err) {
        toast({ title: "Solde insuffisant", description: err, variant: "destructive" });
        return;
      }
    }

    try {
      await addTransaction.mutateAsync({
        account_id: selectedPM,
        payment_method_id: selectedPM,
        category_id: categoryId,
        amount: finalAmount,
        label: label || "Transaction",
        date,
        sms_reference: note || undefined,
      });

      if (isRecurring) {
        await addRecurring.mutateAsync({
          account_id: selectedPM,
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

          {/* Payment Method */}
          <PaymentMethodPicker
            methods={paymentMethods}
            selectedId={pmId || paymentMethods[0]?.id || ""}
            onSelect={setPmId}
          />

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

          {/* Note */}
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
  );
};

export default AddTransactionSheet;

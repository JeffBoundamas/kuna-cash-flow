import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useAddTransaction } from "@/hooks/use-transactions";
import { useAddRecurringTransaction, type RecurringFrequency } from "@/hooks/use-recurring-transactions";
import { useActivePaymentMethodsWithBalance, checkBalanceSufficiency } from "@/hooks/use-payment-methods-with-balance";
import PaymentMethodPicker from "@/components/payment-methods/PaymentMethodPicker";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import CalculatorKeypad from "./CalculatorKeypad";
import CategoryListPicker from "./CategoryListPicker";
import RecurringToggle from "./RecurringToggle";

const STORAGE_KEY = "quickadd_defaults";

function getDefaults(): { categoryId: string; pmId: string; type: "expense" | "income" } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { categoryId: "", pmId: "", type: "expense" };
}

function saveDefaults(data: { categoryId: string; pmId: string; type: "expense" | "income" }) {
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
  const [pmId, setPmId] = useState(defaults.pmId);
  const [categoryId, setCategoryId] = useState(defaults.categoryId);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: paymentMethods = [] } = useActivePaymentMethodsWithBalance();
  const { data: categories = [] } = useCategories();
  const addTransaction = useAddTransaction();
  const addRecurring = useAddRecurringTransaction();

  const filteredCategories = useMemo(
    () => categories.filter((c) => (type === "income" ? c.type === "Income" : c.type === "Expense")),
    [categories, type]
  );

  useEffect(() => {
    if (open) {
      const d = getDefaults();
      setType(d.type);
      setPmId(d.pmId);
      setCategoryId(d.categoryId);
      setAmount("");
      setLabel("");
      setIsRecurring(false);
      setFrequency("monthly");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  // Validate stored defaults
  useEffect(() => {
    if (pmId && paymentMethods.length > 0 && !paymentMethods.find((p) => p.id === pmId)) {
      setPmId(paymentMethods[0]?.id || "");
    }
  }, [paymentMethods, pmId]);

  useEffect(() => {
    if (categoryId && filteredCategories.length > 0 && !filteredCategories.find((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [filteredCategories, categoryId]);

  const handleSubmit = async () => {
    const selectedPM = pmId || paymentMethods[0]?.id;
    if (!amount || !categoryId || !selectedPM) {
      toast({ title: "Remplissez montant, catégorie et compte", variant: "destructive" });
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

      saveDefaults({ categoryId, pmId: selectedPM, type });

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 gap-3 scrollbar-hide">
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

        <CalculatorKeypad value={amount} onChange={setAmount} />

        <input
          type="text"
          placeholder="Libellé (optionnel)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <PaymentMethodPicker
          methods={paymentMethods}
          selectedId={pmId || paymentMethods[0]?.id || ""}
          onSelect={setPmId}
        />

        <CategoryListPicker
          categories={filteredCategories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

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
  );
};

export default QuickAddModal;

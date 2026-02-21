import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useUpdateTransaction } from "@/hooks/use-transactions";
import { useActivePaymentMethodsWithBalance, checkBalanceSufficiency } from "@/hooks/use-payment-methods-with-balance";
import PaymentMethodPicker from "@/components/payment-methods/PaymentMethodPicker";
import CategoryListPicker from "@/components/transactions/CategoryListPicker";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/types";

interface EditTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

const EditTransactionSheet = ({ open, onOpenChange, transaction }: EditTransactionSheetProps) => {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [pmId, setPmId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const { data: paymentMethods = [] } = useActivePaymentMethodsWithBalance();
  const { data: categories = [] } = useCategories();
  const updateTransaction = useUpdateTransaction();

  useEffect(() => {
    if (transaction) {
      setType(transaction.amount > 0 ? "income" : "expense");
      setAmount(String(Math.abs(transaction.amount)));
      setLabel(transaction.label);
      setPmId(transaction.payment_method_id || transaction.account_id || "");
      setCategoryId(transaction.category_id);
      setDate(transaction.date);
      setNote(transaction.sms_reference || "");
    }
  }, [transaction]);

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "Income" : c.type === "Expense"
  );

  const handleSubmit = async () => {
    if (!transaction || !amount || !categoryId || !pmId) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    const numAmount = parseInt(amount);
    const finalAmount = type === "expense" ? -Math.abs(numAmount) : Math.abs(numAmount);

    // Balance validation for expenses
    const pm = paymentMethods.find((p) => p.id === pmId);
    if (pm && finalAmount < 0) {
      // Determine which PM the old transaction was on (payment_method_id or legacy account_id)
      const oldPmId = transaction.payment_method_id || transaction.account_id;
      // Only "add back" the old amount if it was on the same PM
      const oldAmountOnSamePm = oldPmId === pmId ? transaction.amount : 0;
      const adjustedPm = { ...pm, currentBalance: pm.currentBalance - oldAmountOnSamePm };
      const err = checkBalanceSufficiency(adjustedPm, finalAmount);
      if (err) {
        toast({ title: "Solde insuffisant", description: err, variant: "destructive" });
        return;
      }
    }

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        category_id: categoryId,
        amount: finalAmount,
        label: label || "Transaction",
        date,
        sms_reference: note || null,
        payment_method_id: pmId,
      });
      toast({ title: "Transaction modifiée ✓" });
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    }
  };

  if (!transaction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-display">Modifier Transaction</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
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

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Montant (XAF) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-2xl font-bold font-display focus:outline-none focus:ring-2 focus:ring-ring text-center"
              style={{ fontSize: "24px" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Libellé</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }} />
          </div>

          <PaymentMethodPicker methods={paymentMethods} selectedId={pmId} onSelect={setPmId} />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Catégorie *</label>
            <CategoryListPicker categories={filteredCategories} selectedId={categoryId} onSelect={setCategoryId} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              style={{ fontSize: "16px" }} />
          </div>

          <Button onClick={handleSubmit} disabled={updateTransaction.isPending}
            className="w-full rounded-xl py-6 text-base font-semibold" size="lg">
            {updateTransaction.isPending ? "Modification..." : "Modifier"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditTransactionSheet;

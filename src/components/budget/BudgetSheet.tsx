import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useUpsertBudget } from "@/hooks/use-budgets";
import { formatXAF, parseAmount } from "@/lib/currency";
import type { Budget, Category } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
  existingBudget?: Budget & { category?: Category };
  usedCategoryIds: string[];
}

const BudgetSheet = ({ open, onOpenChange, month, year, existingBudget, usedCategoryIds }: Props) => {
  const { data: categories = [] } = useCategories();
  const upsert = useUpsertBudget();

  const [categoryId, setCategoryId] = useState("");
  const [amountStr, setAmountStr] = useState("");

  useEffect(() => {
    if (existingBudget) {
      setCategoryId(existingBudget.category_id);
      setAmountStr(existingBudget.amount_limit.toString());
    } else {
      setCategoryId("");
      setAmountStr("");
    }
  }, [existingBudget, open]);

  const expenseCategories = categories.filter(
    (c) => c.type === "Expense" && (!usedCategoryIds.includes(c.id) || c.id === existingBudget?.category_id)
  );

  const handleSubmit = () => {
    const amount = parseAmount(amountStr);
    if (!categoryId || amount <= 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    upsert.mutate(
      { category_id: categoryId, amount_limit: amount, month, year, id: existingBudget?.id },
      {
        onSuccess: () => {
          toast.success(existingBudget ? "Budget modifié" : "Budget ajouté");
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur lors de l'enregistrement"),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{existingBudget ? "Modifier le budget" : "Ajouter un budget"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={!!existingBudget}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Limite mensuelle (XAF)</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Ex: 150000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
            {parseAmount(amountStr) > 0 && (
              <p className="text-xs text-muted-foreground">{formatXAF(parseAmount(amountStr))}</p>
            )}
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={upsert.isPending}>
            {existingBudget ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BudgetSheet;

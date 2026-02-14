import { useMemo, useState } from "react";
import { formatXAF } from "@/lib/currency";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets, useDeleteBudget } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import BudgetSheet from "@/components/budget/BudgetSheet";
import type { Budget, Category } from "@/lib/types";
import { toast } from "sonner";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const MONTH_NAMES = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type BudgetItem = Budget & { category?: Category; spent: number; pct: number };

const getBarColor = (pct: number) => {
  if (pct > 90) return "bg-destructive";
  if (pct > 70) return "bg-accent";
  return "bg-primary";
};

const getTextColor = (pct: number) => {
  if (pct > 90) return "text-destructive";
  if (pct > 70) return "text-accent-foreground";
  return "text-primary";
};

const BudgetPage = () => {
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets(currentMonth, currentYear);
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(currentMonth, currentYear);
  const { data: categories = [] } = useCategories();
  const deleteBudget = useDeleteBudget();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | undefined>();

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const budgetItems: BudgetItem[] = useMemo(() => {
    return budgets.map((b) => {
      const cat = catMap.get(b.category_id);
      const spent = transactions
        .filter((t) => t.category_id === b.category_id && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const pct = b.amount_limit > 0 ? Math.round((spent / b.amount_limit) * 100) : 0;
      return { ...b, category: cat, spent, pct };
    });
  }, [budgets, transactions, catMap]);

  const exceededBudgets = budgetItems.filter((b) => b.pct > 100);
  const totalBudget = budgets.reduce((s, b) => s + b.amount_limit, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const usedCategoryIds = budgets.map((b) => b.category_id);

  const handleEdit = (item: BudgetItem) => {
    setEditingBudget(item);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingBudget(undefined);
    setSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBudget.mutate(id, {
      onSuccess: () => toast.success("Budget supprimé"),
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  };

  const isLoading = loadingBudgets || loadingTx;

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-24 space-y-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Budget</h1>
        <Button size="sm" onClick={handleAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Alert banners for exceeded budgets */}
      {exceededBudgets.map((item) => (
        <Alert key={item.id} variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>{item.category?.name}</strong> a dépassé son budget : {formatXAF(item.spent)} / {formatXAF(item.amount_limit)} ({item.pct}%)
          </AlertDescription>
        </Alert>
      ))}

      {budgets.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-muted-foreground">
            Aucun budget défini pour ce mois.
          </p>
          <Button variant="outline" onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Définir un budget
          </Button>
        </div>
      ) : (
        <>
          {/* Overall progress */}
          <div className="rounded-xl bg-card border border-border p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </p>
              <p className={cn("text-sm font-bold font-display", getTextColor(totalPct))}>
                {totalPct}%
              </p>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", getBarColor(totalPct))}
                style={{ width: `${Math.min(100, totalPct)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Dépensé : {formatXAF(totalSpent)}</span>
              <span>Budget : {formatXAF(totalBudget)}</span>
            </div>
          </div>

          {/* Budget categories */}
          <div className="space-y-2.5">
            {budgetItems.map((item, i) => (
              <div
                key={item.id}
                className="rounded-xl bg-card border border-border p-3 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium">{item.category?.name}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 rounded-md hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", getBarColor(item.pct))}
                    style={{ width: `${Math.min(100, item.pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {formatXAF(item.spent)} / {formatXAF(item.amount_limit)}
                  </span>
                  <span className={cn("text-xs font-semibold", getTextColor(item.pct))}>
                    {item.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <BudgetSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        month={currentMonth}
        year={currentYear}
        existingBudget={editingBudget}
        usedCategoryIds={usedCategoryIds}
      />
    </div>
  );
};

export default BudgetPage;

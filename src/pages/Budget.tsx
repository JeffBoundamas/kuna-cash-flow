import { useMemo } from "react";
import { formatXAF } from "@/lib/currency";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const BudgetPage = () => {
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets(currentMonth, currentYear);
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(currentMonth, currentYear);
  const { data: categories = [] } = useCategories();

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const budgetItems = useMemo(() => {
    return budgets.map((b) => {
      const cat = catMap.get(b.category_id);
      const spent = transactions
        .filter((t) => t.category_id === b.category_id && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const pct = b.amount_limit > 0 ? Math.min(100, Math.round((spent / b.amount_limit) * 100)) : 0;
      return { ...b, category: cat, spent, pct };
    });
  }, [budgets, transactions, catMap]);

  const totalBudget = budgets.reduce((s, b) => s + b.amount_limit, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const getNatureColor = (nature?: string) => {
    if (nature === "Essential") return "bg-primary";
    if (nature === "Desire") return "bg-accent";
    return "bg-info";
  };

  const getNatureBg = (nature?: string) => {
    if (nature === "Essential") return "bg-primary/10";
    if (nature === "Desire") return "bg-accent/10";
    return "bg-primary/10";
  };

  const isLoading = loadingBudgets || loadingTx;

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <h1 className="text-xl font-bold font-display">Budget</h1>

      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucun budget défini pour ce mois. Ajoutez des budgets pour suivre vos dépenses.
        </p>
      ) : (
        <>
          {/* Overall progress */}
          <div className="rounded-xl bg-card border border-border p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Février {currentYear}</p>
              <p className={cn(
                "text-sm font-bold font-display",
                totalPct > 90 ? "text-destructive" : "text-primary"
              )}>
                {totalPct}%
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  totalPct > 90 ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${totalPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Dépensé: {formatXAF(totalSpent)}</span>
              <span>Budget: {formatXAF(totalBudget)}</span>
            </div>
          </div>

          {/* Budget categories */}
          <div className="space-y-2">
            {budgetItems.map((item, i) => (
              <div
                key={item.id}
                className="rounded-xl bg-card border border-border p-3 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", getNatureColor(item.category?.nature))} />
                    <p className="text-sm font-medium">{item.category?.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatXAF(item.spent)} / {formatXAF(item.amount_limit)}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      item.pct > 100
                        ? "bg-destructive"
                        : item.pct > 80
                        ? "bg-accent"
                        : getNatureColor(item.category?.nature)
                    )}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-md font-medium",
                    getNatureBg(item.category?.nature),
                    item.category?.nature === "Essential" ? "text-primary" : 
                    item.category?.nature === "Desire" ? "text-accent-foreground" : "text-primary"
                  )}>
                    {item.category?.nature === "Essential" ? "Besoin" : 
                     item.category?.nature === "Desire" ? "Envie" : "Épargne"}
                  </span>
                  <span className={cn(
                    "text-[11px] font-semibold",
                    item.pct > 100 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {item.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetPage;

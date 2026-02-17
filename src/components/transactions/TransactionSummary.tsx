import { useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Transaction, Category } from "@/lib/types";

interface TransactionSummaryProps {
  transactions: Transaction[];
  catMap: Map<string, Category>;
  accMap: Map<string, { name: string }>;
}

const TransactionSummary = ({ transactions, catMap, accMap }: TransactionSummaryProps) => {
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCat: Record<string, number> = {};
    const byAcc: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else expense += Math.abs(t.amount);

      const catName = catMap.get(t.category_id)?.name ?? "Autre";
      byCat[catName] = (byCat[catName] ?? 0) + Math.abs(t.amount);

      const accName = accMap.get(t.account_id)?.name ?? "Inconnu";
      byAcc[accName] = (byAcc[accName] ?? 0) + Math.abs(t.amount);
    });

    const topCategories = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topAccounts = Object.entries(byAcc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { income, expense, net: income - expense, count: transactions.length, topCategories, topAccounts };
  }, [transactions, catMap, accMap]);

  if (stats.count === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Résumé</h3>
        <span className="text-[10px] text-muted-foreground">{stats.count} mouvements</span>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center">
          <TrendingUp className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Revenus</p>
          <p className="text-xs font-bold font-display text-primary">{formatXAF(stats.income)}</p>
        </div>
        <div className="rounded-lg bg-destructive/10 p-2.5 text-center">
          <TrendingDown className="h-3.5 w-3.5 text-destructive mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Dépenses</p>
          <p className="text-xs font-bold font-display text-destructive">{formatXAF(stats.expense)}</p>
        </div>
        <div className="rounded-lg bg-muted p-2.5 text-center">
          <ArrowRightLeft className="h-3.5 w-3.5 text-foreground mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Solde net</p>
          <p className={cn(
            "text-xs font-bold font-display",
            stats.net >= 0 ? "text-primary" : "text-destructive"
          )}>
            {stats.net >= 0 ? "+" : ""}{formatXAF(stats.net)}
          </p>
        </div>
      </div>

      {/* Top categories */}
      {stats.topCategories.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Top catégories
          </p>
          <div className="space-y-1.5">
            {stats.topCategories.map(([name, amount]) => {
              const pct = stats.income + stats.expense > 0
                ? (amount / (stats.income + stats.expense)) * 100
                : 0;
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground w-24 truncate">{name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground w-20 text-right">
                    {formatXAF(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top accounts */}
      {stats.topAccounts.length > 1 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Par compte
          </p>
          <div className="space-y-1.5">
            {stats.topAccounts.map(([name, amount]) => {
              const pct = stats.income + stats.expense > 0
                ? (amount / (stats.income + stats.expense)) * 100
                : 0;
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground w-24 truncate">{name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-foreground/40 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground w-20 text-right">
                    {formatXAF(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSummary;

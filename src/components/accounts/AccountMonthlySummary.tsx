import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const AccountMonthlySummary = ({ transactions }: Props) => {
  const { income, expenses } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let income = 0;
    let expenses = 0;

    for (const tx of transactions) {
      const d = new Date(tx.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (tx.amount > 0) income += tx.amount;
        else expenses += Math.abs(tx.amount);
      }
    }
    return { income, expenses };
  }, [transactions]);

  const net = income - expenses;

  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Résumé du mois</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">Revenus</span>
          </div>
          <p className="text-sm font-bold font-display text-primary">{formatXAF(income)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingDown className="h-3 w-3 text-destructive" />
            <span className="text-[10px] text-muted-foreground">Dépenses</span>
          </div>
          <p className="text-sm font-bold font-display text-destructive">{formatXAF(expenses)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className="text-[10px] text-muted-foreground">Solde net</span>
          </div>
          <p className={`text-sm font-bold font-display ${net >= 0 ? "text-primary" : "text-destructive"}`}>
            {net >= 0 ? "+" : ""}{formatXAF(net)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountMonthlySummary;

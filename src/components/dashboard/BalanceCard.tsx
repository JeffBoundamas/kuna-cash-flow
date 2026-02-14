import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { formatXAF, formatXAFShort } from "@/lib/currency";

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const BalanceCard = ({ totalBalance, monthlyIncome, monthlyExpenses }: BalanceCardProps) => (
  <div className="rounded-2xl bg-foreground p-5 text-background animate-fade-in">
    <div className="flex items-center gap-2 text-sm opacity-80 mb-1">
      <Wallet className="h-4 w-4" />
      <span>Patrimoine Net</span>
    </div>
    <p className="text-2xl font-bold font-display tracking-tight">
      {formatXAF(totalBalance)}
    </p>
    <div className="mt-4 flex gap-4">
      <div className="flex items-center gap-1.5 text-xs">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="opacity-60">Revenus</p>
          <p className="font-semibold">{formatXAFShort(monthlyIncome)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/20">
          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
        </div>
        <div>
          <p className="opacity-60">Dépenses</p>
          <p className="font-semibold">{formatXAFShort(monthlyExpenses)}</p>
        </div>
      </div>
    </div>
  </div>
);

export default BalanceCard;

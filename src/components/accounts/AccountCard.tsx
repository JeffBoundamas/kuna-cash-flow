import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Smartphone, Banknote, Users, TrendingUp, TrendingDown } from "lucide-react";
import { formatXAFShort, formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

type Account = { id: string; name: string; type?: string; balance?: number; icon?: string };

const typeConfig: Record<string, { icon: typeof Landmark; gradient: string }> = {
  Bank: { icon: Landmark, gradient: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800" },
  "Mobile Money": { icon: Smartphone, gradient: "from-amber-500/10 to-orange-600/5 border-amber-200 dark:border-amber-800" },
  Cash: { icon: Banknote, gradient: "from-emerald-500/10 to-green-600/5 border-emerald-200 dark:border-emerald-800" },
  Tontine: { icon: Users, gradient: "from-violet-500/10 to-purple-600/5 border-violet-200 dark:border-violet-800" },
};

interface AccountCardProps {
  account: Account;
  lastTransaction?: Transaction;
  categoryName?: string;
  onTap: () => void;
}

const AccountCard = ({ account, lastTransaction, categoryName, onTap }: AccountCardProps) => {
  const config = typeConfig[account.type] || typeConfig.Bank;
  const Icon = config.icon;

  return (
    <button
      onClick={onTap}
      className={cn(
        "w-full rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:shadow-md active:scale-[0.98]",
        config.gradient
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/80 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold font-display truncate">{account.name}</p>
            <p className="text-[11px] text-muted-foreground">{account.type}</p>
          </div>
        </div>
      </div>

      <p className="text-xl font-bold font-display text-foreground mb-2">
        {formatXAFShort(account.balance)}
      </p>

      {lastTransaction ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {lastTransaction.amount > 0 ? (
            <TrendingUp className="h-3 w-3 text-primary" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          <span className="truncate">
            {lastTransaction.label} · {formatXAF(lastTransaction.amount)}
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Aucune transaction</p>
      )}
    </button>
  );
};

export default AccountCard;

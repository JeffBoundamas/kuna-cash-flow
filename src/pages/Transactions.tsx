import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import AddTransactionSheet from "@/components/transactions/AddTransactionSheet";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: transactions = [], isLoading } = useTransactions(currentMonth, currentYear);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  const sorted = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const cat = catMap.get(t.category_id);
      return (
        t.label.toLowerCase().includes(search.toLowerCase()) ||
        cat?.name.toLowerCase().includes(search.toLowerCase())
      );
    });
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [search, transactions, catMap]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof sorted> = {};
    sorted.forEach((t) => {
      const dateKey = t.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }, [sorted]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Mouvements</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Fév. {currentYear}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction ce mois-ci.</p>
      ) : (
        <div className="space-y-4 pb-4">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="animate-fade-in">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {formatDate(date)}
              </p>
              <div className="space-y-1">
                {txs.map((tx) => {
                  const cat = catMap.get(tx.category_id);
                  const acc = accMap.get(tx.account_id);
                  const isIncome = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 rounded-xl bg-card border border-border p-3"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0",
                          isIncome ? "bg-emerald-light" : "bg-muted"
                        )}
                      >
                        {isIncome ? (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {cat?.name} · {acc?.name}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "text-sm font-bold font-display whitespace-nowrap",
                          isIncome ? "text-primary" : "text-foreground"
                        )}
                      >
                        {isIncome ? "+" : ""}
                        {formatXAF(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddTransactionSheet open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
};

export default Transactions;

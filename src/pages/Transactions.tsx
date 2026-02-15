import { useState, useMemo, useCallback } from "react";
import {
  
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { formatXAF, formatXAFShort } from "@/lib/currency";
import { useAllTransactions, useDeleteTransaction } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import AddTransactionSheet from "@/components/transactions/AddTransactionSheet";
import EditTransactionSheet from "@/components/transactions/EditTransactionSheet";
import SwipeableRow from "@/components/transactions/SwipeableRow";
import TransactionFilterBar, { emptyFilters, type TransactionFilters } from "@/components/transactions/TransactionFilterBar";
import TransactionSummary from "@/components/transactions/TransactionSummary";
import { toast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/types";

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);

  const { data: transactions = [], isLoading } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const deleteTx = useDeleteTransaction();

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Nature filter
      if (filters.nature === "income" && t.amount <= 0) return false;
      if (filters.nature === "expense" && t.amount >= 0) return false;

      // Search by label, note, amount, or category
      if (search) {
        const q = search.toLowerCase();
        const cat = catMap.get(t.category_id);
        const matchesSearch =
          t.label.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q) ||
          (t.sms_reference && t.sms_reference.toLowerCase().includes(q)) ||
          String(Math.abs(t.amount)).includes(q);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;

      // Category filter
      if (filters.categoryId && t.category_id !== filters.categoryId) return false;

      // Account filter
      if (filters.accountId && t.account_id !== filters.accountId) return false;

      return true;
    });
  }, [search, transactions, catMap, filters]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    sorted.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [sorted]);

  // Running balance per account
  const runningBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(a => { balances[a.id] = a.balance; });
    return balances;
  }, [accounts]);

  const handleDelete = useCallback(async (tx: Transaction) => {
    try {
      await deleteTx.mutateAsync({ id: tx.id, amount: tx.amount, accountId: tx.account_id });
      toast({ title: "Transaction supprimée" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  }, [deleteTx]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="px-4 pt-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Mouvements</h1>
        <span className="text-xs text-muted-foreground">{sorted.length} transactions</span>
      </div>

      {/* Running balance per account */}
      {accounts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="min-w-[120px] rounded-lg border border-border bg-card px-3 py-2 flex-shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground truncate">{acc.name}</span>
              </div>
              <p className="text-xs font-bold font-display text-primary mt-0.5">
                {formatXAFShort(runningBalances[acc.id] ?? 0)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par note, montant, catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filters */}
      <TransactionFilterBar
        filters={filters}
        onChange={setFilters}
        accounts={accounts}
        categories={categories}
      />

      {/* Summary */}
      <TransactionSummary
        transactions={sorted}
        catMap={catMap}
        accMap={accMap}
      />

      {/* Transaction List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {transactions.length === 0 ? "Aucune transaction." : "Aucun résultat pour ces filtres."}
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="animate-fade-in">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {formatDate(date)}
              </p>
              <div className="space-y-1.5">
                {txs.map((tx) => {
                  const cat = catMap.get(tx.category_id);
                  const acc = accMap.get(tx.account_id);
                  const isIncome = tx.amount > 0;
                  return (
                    <SwipeableRow
                      key={tx.id}
                      onDelete={() => handleDelete(tx)}
                      onTap={() => setEditTx(tx)}
                    >
                      <div className="flex items-center gap-3 p-3">
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
                    </SwipeableRow>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTransactionSheet open={showAdd} onOpenChange={setShowAdd} />
      <EditTransactionSheet
        open={!!editTx}
        onOpenChange={(open) => { if (!open) setEditTx(null); }}
        transaction={editTx}
      />
    </div>
  );
};

export default Transactions;

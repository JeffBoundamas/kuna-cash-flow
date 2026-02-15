import { useState, useMemo } from "react";
import { Plus, ArrowRightLeft, ArrowLeft, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { useAllTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import AccountCard from "@/components/accounts/AccountCard";
import AddAccountSheet from "@/components/accounts/AddAccountSheet";
import TransferSheet from "@/components/accounts/TransferSheet";
import EditAccountSheet from "@/components/accounts/EditAccountSheet";
import AccountBalanceChart from "@/components/accounts/AccountBalanceChart";
import AccountMonthlySummary from "@/components/accounts/AccountMonthlySummary";
import SwipeableRow from "@/components/transactions/SwipeableRow";
import EditTransactionSheet from "@/components/transactions/EditTransactionSheet";
import { useDeleteTransaction } from "@/hooks/use-transactions";
import { toast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/types";

const Accounts = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: transactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const deleteTx = useDeleteTransaction();

  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAccount, setEditAccount] = useState(false);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const lastTxByAccount = useMemo(() => {
    const map: Record<string, Transaction> = {};
    for (const tx of transactions) {
      if (!map[tx.account_id]) map[tx.account_id] = tx;
    }
    return map;
  }, [transactions]);

  const accountTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    return transactions
      .filter((t) => t.account_id === selectedAccountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAccountId, transactions]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleDelete = async (tx: Transaction) => {
    try {
      await deleteTx.mutateAsync({ id: tx.id, amount: tx.amount, accountId: tx.account_id });
      toast({ title: "Transaction supprimée" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  // Detail view
  if (selectedAccountId && selectedAccount) {
    return (
      <div className="px-4 pt-6 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedAccountId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <button
            onClick={() => setEditAccount(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Modifier le compte"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">{selectedAccount.name}</h1>
            <p className="text-xs text-muted-foreground">{selectedAccount.type}</p>
          </div>
          <p className="text-lg font-bold font-display text-primary">
            {formatXAF(selectedAccount.balance)}
          </p>
        </div>

        <AccountBalanceChart transactions={accountTransactions} currentBalance={selectedAccount.balance} />
        <AccountMonthlySummary transactions={accountTransactions} />

        <p className="text-xs text-muted-foreground">{accountTransactions.length} transactions</p>

        {accountTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction pour ce compte.</p>
        ) : (
          <div className="space-y-1.5">
            {accountTransactions.map((tx) => {
              const cat = catMap.get(tx.category_id);
              const isIncome = tx.amount > 0;
              return (
                <SwipeableRow key={tx.id} onDelete={() => handleDelete(tx)} onTap={() => setEditTx(tx)}>
                  <div className="flex items-center gap-3 p-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0", isIncome ? "bg-emerald-light" : "bg-muted")}>
                      {isIncome ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{cat?.name} · {formatDate(tx.date)}</p>
                    </div>
                    <p className={cn("text-sm font-bold font-display whitespace-nowrap", isIncome ? "text-primary" : "text-foreground")}>
                      {isIncome ? "+" : ""}{formatXAF(tx.amount)}
                    </p>
                  </div>
                </SwipeableRow>
              );
            })}
          </div>
        )}

        <EditTransactionSheet open={!!editTx} onOpenChange={(open) => { if (!open) setEditTx(null); }} transaction={editTx} />
        <EditAccountSheet
          open={editAccount}
          onOpenChange={setEditAccount}
          account={selectedAccount}
          onDeleted={() => setSelectedAccountId(null)}
        />
      </div>
    );
  }

  // Main list
  return (
    <div className="px-4 pt-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Mes Comptes</h1>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <button
              onClick={() => setShowTransfer(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Transfert"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Ajouter un compte"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">Aucun compte. Créez votre premier compte.</p>
          <button onClick={() => setShowAdd(true)} className="text-sm font-medium text-primary">
            + Ajouter un compte
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              lastTransaction={lastTxByAccount[acc.id]}
              categoryName={lastTxByAccount[acc.id] ? catMap.get(lastTxByAccount[acc.id].category_id)?.name : undefined}
              onTap={() => setSelectedAccountId(acc.id)}
            />
          ))}
        </div>
      )}

      <AddAccountSheet open={showAdd} onOpenChange={setShowAdd} />
      <TransferSheet open={showTransfer} onOpenChange={setShowTransfer} />
    </div>
  );
};

export default Accounts;

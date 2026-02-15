import { useState, useMemo } from "react";
import { Plus, ArrowRightLeft, ArrowLeft, Pencil, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import { icons } from "lucide-react";
import { usePaymentMethodsWithBalance, type PaymentMethodWithBalance } from "@/hooks/use-payment-methods-with-balance";
import { useAllTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import TransferSheet from "@/components/accounts/TransferSheet";
import AccountBalanceChart from "@/components/accounts/AccountBalanceChart";
import AccountMonthlySummary from "@/components/accounts/AccountMonthlySummary";
import SwipeableRow from "@/components/transactions/SwipeableRow";
import EditTransactionSheet from "@/components/transactions/EditTransactionSheet";
import PaymentMethodSheet from "@/components/payment-methods/PaymentMethodSheet";
import { useDeleteTransaction } from "@/hooks/use-transactions";
import { toast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/types";

const Accounts = () => {
  const { data: methods = [], isLoading } = usePaymentMethodsWithBalance();
  const { data: transactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const deleteTx = useDeleteTransaction();

  const [showTransfer, setShowTransfer] = useState(false);
  const [showPMSheet, setShowPMSheet] = useState(false);
  const [editPM, setEditPM] = useState<PaymentMethodWithBalance | null>(null);
  const [selectedPMId, setSelectedPMId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const sorted = useMemo(() => {
    const active = methods.filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
    const inactive = methods.filter((m) => !m.is_active).sort((a, b) => a.sort_order - b.sort_order);
    return [...active, ...inactive];
  }, [methods]);

  const nextSortOrder = methods.length > 0 ? Math.max(...methods.map((m) => m.sort_order)) + 1 : 1;

  const lastTxByPM = useMemo(() => {
    const map: Record<string, Transaction> = {};
    for (const tx of transactions) {
      const pmId = tx.payment_method_id || tx.account_id;
      if (!map[pmId]) map[pmId] = tx;
    }
    return map;
  }, [transactions]);

  const pmTransactions = useMemo(() => {
    if (!selectedPMId) return [];
    return transactions
      .filter((t) => (t.payment_method_id || t.account_id) === selectedPMId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPMId, transactions]);

  const selectedPM = methods.find((m) => m.id === selectedPMId);

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

  const handleAdd = () => {
    setEditPM(null);
    setShowPMSheet(true);
  };

  const handleEditPM = (pm: PaymentMethodWithBalance) => {
    setEditPM(pm);
    setShowPMSheet(true);
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
  if (selectedPMId && selectedPM) {
    const Icon = (icons as any)[selectedPM.icon] || (icons as any)["Wallet"];
    return (
      <div className="px-4 pt-6 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedPMId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <button
            onClick={() => handleEditPM(selectedPM)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: selectedPM.color + "20" }}>
              <Icon className="h-5 w-5" style={{ color: selectedPM.color }} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">{selectedPM.name}</h1>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">{selectedPM.method_type}</p>
                {!selectedPM.allow_negative_balance && <ShieldCheck className="h-3 w-3 text-muted-foreground" />}
              </div>
            </div>
          </div>
          <p className={cn("text-lg font-bold font-display", selectedPM.currentBalance >= 0 ? "text-primary" : "text-destructive")}>
            {formatXAF(selectedPM.currentBalance)}
          </p>
        </div>

        <AccountBalanceChart transactions={pmTransactions} currentBalance={selectedPM.currentBalance} />
        <AccountMonthlySummary transactions={pmTransactions} />

        <p className="text-xs text-muted-foreground">{pmTransactions.length} transactions</p>

        {pmTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction pour ce compte.</p>
        ) : (
          <div className="space-y-1.5">
            {pmTransactions.map((tx) => {
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
                    <p className={cn("text-sm font-bold font-display text-right flex-shrink-0", isIncome ? "text-primary" : "text-foreground")}>
                      {isIncome ? "+" : ""}{formatXAF(tx.amount)}
                    </p>
                  </div>
                </SwipeableRow>
              );
            })}
          </div>
        )}

        <EditTransactionSheet open={!!editTx} onOpenChange={(o) => { if (!o) setEditTx(null); }} transaction={editTx} />
        <PaymentMethodSheet
          open={showPMSheet}
          onOpenChange={setShowPMSheet}
          editItem={editPM}
          nextSortOrder={nextSortOrder}
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
          {sorted.length >= 2 && (
            <button
              onClick={() => setShowTransfer(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleAdd}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">Aucun compte. Créez votre premier moyen de paiement.</p>
          <button onClick={handleAdd} className="text-sm font-medium text-primary">
            + Ajouter un moyen de paiement
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {sorted.map((pm) => {
            const Icon = (icons as any)[pm.icon] || (icons as any)["Wallet"];
            const lastTx = lastTxByPM[pm.id];
            return (
              <button
                key={pm.id}
                onClick={() => setSelectedPMId(pm.id)}
                className={cn(
                  "w-full rounded-2xl border border-border bg-card p-4 text-left hover:shadow-sm transition-all active:scale-[0.98]",
                  !pm.is_active && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                    style={{ backgroundColor: pm.color + "20" }}>
                    <Icon className="h-5 w-5" style={{ color: pm.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{pm.name}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] text-muted-foreground">
                        {pm.method_type === "cash" ? "Espèces" :
                         pm.method_type === "bank_account" ? "Compte bancaire" :
                         pm.method_type === "mobile_money" ? "Mobile Money" :
                         pm.method_type === "credit_card" ? "Carte bancaire" : "Chèque"}
                      </p>
                      {!pm.allow_negative_balance && <ShieldCheck className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    {lastTx && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        Dernière : {lastTx.label} · {formatDate(lastTx.date)}
                      </p>
                    )}
                  </div>
                  <p className={cn("text-sm font-bold font-display text-right flex-shrink-0", pm.currentBalance >= 0 ? "text-primary" : "text-destructive")}>
                    {formatXAF(pm.currentBalance)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <TransferSheet open={showTransfer} onOpenChange={setShowTransfer} />
      <PaymentMethodSheet
        open={showPMSheet}
        onOpenChange={setShowPMSheet}
        editItem={editPM}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
};

export default Accounts;

import { useMemo, useState } from "react";
import { Sparkles, Calendar, Plus } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { calculateResteAVivre } from "@/lib/currency";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useMonthlySavings } from "@/hooks/use-monthly-savings";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatXAFShort } from "@/lib/currency";
import AddAccountSheet from "@/components/accounts/AddAccountSheet";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SavingsRate from "@/components/dashboard/SavingsRate";
import ExpensesByCategoryDonut from "@/components/dashboard/ExpensesByCategoryDonut";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const Dashboard = () => {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(currentMonth, currentYear);
  const { data: categories = [] } = useCategories();
  const { data: monthlySummary = [] } = useMonthlySummary(6);
  const { data: monthlySavings = 0 } = useMonthlySavings();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const monthlyIncome = useMemo(() => transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const monthlyExpenses = useMemo(() => transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);

  const resteAVivre = useMemo(
    () => calculateResteAVivre(monthlyIncome, monthlyExpenses, now.getDate()),
    [monthlyIncome, monthlyExpenses]
  );

  const isLoading = loadingAccounts || loadingTx;

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour 👋</p>
          <h1 className="text-xl font-bold font-display">Kuna Finance</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      {/* Net Worth Card */}
      <BalanceCard totalBalance={totalBalance} monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} />

      {/* Reste à vivre */}
      <div className="rounded-xl bg-emerald-light p-4 flex items-center justify-between animate-fade-in" style={{ animationDelay: "0.05s" }}>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-dark font-medium mb-0.5">
            <Calendar className="h-3.5 w-3.5" />
            Reste à vivre / jour
          </div>
          <p className="text-lg font-bold font-display text-foreground">{formatXAF(resteAVivre)}</p>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          <p>{now.toLocaleDateString("fr-FR", { month: "short" })} {currentYear}</p>
        </div>
      </div>

      {/* Savings Rate */}
      <SavingsRate monthlyIncome={monthlyIncome} monthlySavings={monthlySavings} />

      {/* Accounts */}
      <div className="animate-fade-in" style={{ animationDelay: "0.12s" }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold font-display text-muted-foreground">Mes Comptes</h2>
          <Button size="sm" variant="ghost" onClick={() => setAccountSheetOpen(true)} className="h-7 w-7 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun compte ajouté. Appuyez sur + pour commencer.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {accounts.map((acc) => (
              <div key={acc.id} className="min-w-[140px] rounded-xl border border-border bg-card p-3 flex-shrink-0">
                <p className="text-[11px] text-muted-foreground truncate">{acc.type}</p>
                <p className="text-sm font-semibold truncate">{acc.name}</p>
                <p className="text-sm font-bold font-display mt-1 text-primary">{formatXAFShort(acc.balance)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses by Category Donut */}
      <ExpensesByCategoryDonut transactions={transactions} categories={categories} />

      {/* Income vs Expenses Bar Chart */}
      <IncomeExpenseChart data={monthlySummary} />

      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} categories={categories} />

      <AddAccountSheet open={accountSheetOpen} onOpenChange={setAccountSheetOpen} />
    </div>
  );
};

export default Dashboard;

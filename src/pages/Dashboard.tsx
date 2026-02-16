import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Settings } from "lucide-react";
import { icons } from "lucide-react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import TontineDashboardCard from "@/components/tontines/TontineDashboardCard";
import { formatXAF, formatXAFShort, calculateResteAVivre } from "@/lib/currency";
import { toast } from "sonner";
import { usePaymentMethodsWithBalance } from "@/hooks/use-payment-methods-with-balance";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { useMonthlySavings } from "@/hooks/use-monthly-savings";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SavingsRate from "@/components/dashboard/SavingsRate";
import ExpensesByCategoryDonut from "@/components/dashboard/ExpensesByCategoryDonut";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import TresorerieCard from "@/components/dashboard/TresorerieCard";
import ChargesDuMoisWidget from "@/components/dashboard/ChargesDuMoisWidget";
import { cn } from "@/lib/utils";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const Dashboard = () => {
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("kuna_onboarding_done"));
  const { data: methods = [], isLoading: loadingPM } = usePaymentMethodsWithBalance();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(currentMonth, currentYear);
  const { data: categories = [] } = useCategories();
  const { data: monthlySummary = [] } = useMonthlySummary(6);
  const { data: monthlySavings = 0 } = useMonthlySavings();
  const navigate = useNavigate();




  const totalBalance = useMemo(() => methods.filter(m => m.is_active).reduce((sum, m) => sum + m.currentBalance, 0), [methods]);
  const monthlyIncome = useMemo(() => transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const monthlyExpenses = useMemo(() => transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);

  const resteAVivre = useMemo(
    () => calculateResteAVivre(monthlyIncome, monthlyExpenses, now.getDate()),
    [monthlyIncome, monthlyExpenses]
  );
  const isLoading = loadingPM || loadingTx;

  // Alert when reste à vivre is negative
  useEffect(() => {
    if (!isLoading && resteAVivre < 0) {
      const key = `kuna_rav_alert_${currentMonth}_${currentYear}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        toast.error("Reste à vivre négatif", {
          description: `Vos dépenses dépassent vos revenus ce mois-ci. Budget quotidien : ${formatXAF(resteAVivre)}`,
          duration: 8000,
        });
      }
    }
  }, [isLoading, resteAVivre]);

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

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
    <div className="px-4 lg:px-6 pt-6 pb-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bonjour 👋</p>
            <h1 className="text-xl font-bold font-display">Kuna Finance</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/settings")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Net Worth Card */}
        <BalanceCard totalBalance={totalBalance} monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} />

        {/* Reste à vivre */}
        <div className={cn("rounded-xl p-4 flex items-center justify-between animate-fade-in", resteAVivre >= 0 ? "bg-emerald-light" : "bg-destructive/10")} style={{ animationDelay: "0.05s" }}>
          <div>
            <div className={cn("flex items-center gap-1.5 text-xs font-medium mb-0.5", resteAVivre >= 0 ? "text-emerald-dark" : "text-destructive")}>
              <Calendar className="h-3.5 w-3.5" />
              Reste à vivre / jour
            </div>
            <p className={cn("text-lg font-bold font-display", resteAVivre >= 0 ? "text-foreground" : "text-destructive")}>{formatXAF(resteAVivre)}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <p>{now.toLocaleDateString("fr-FR", { month: "short" })} {currentYear}</p>
          </div>
        </div>

        {/* Grid for desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Trésorerie réelle */}
          <TresorerieCard totalBalance={totalBalance} />

          {/* Charges du mois */}
          <ChargesDuMoisWidget />

          {/* Tontines Summary */}
          <TontineDashboardCard />

          {/* Savings Rate */}
          <SavingsRate monthlyIncome={monthlyIncome} monthlySavings={monthlySavings} />
        </div>

        {/* Accounts from payment methods */}
        <div className="animate-fade-in" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold font-display text-muted-foreground">Mes Comptes</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate("/portfolio")} className="h-7 px-2 text-xs">
              Voir tout
            </Button>
          </div>
          {methods.filter(m => m.is_active).length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun moyen de paiement configuré.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {methods.filter(m => m.is_active).sort((a, b) => a.sort_order - b.sort_order).map((pm) => {
                const Icon = (icons as any)[pm.icon] || (icons as any)["Wallet"];
                return (
                  <button
                    key={pm.id}
                    onClick={() => navigate("/portfolio")}
                    className="min-w-[140px] rounded-xl border border-border bg-card p-3 flex-shrink-0 text-left hover:shadow-sm transition-shadow active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: pm.color + "20" }}>
                        <Icon className="h-3 w-3" style={{ color: pm.color }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {pm.method_type === "cash" ? "Espèces" :
                         pm.method_type === "bank_account" ? "Banque" :
                         pm.method_type === "mobile_money" ? "Mobile" :
                         pm.method_type === "credit_card" ? "Carte" : "Chèque"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold truncate">{pm.name}</p>
                    <p className="text-sm font-bold font-display mt-1 text-primary">{formatXAFShort(pm.currentBalance)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Charts grid for desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Expenses by Category Donut */}
          <ExpensesByCategoryDonut transactions={transactions} categories={categories} />

          {/* Income vs Expenses Bar Chart */}
          <IncomeExpenseChart data={monthlySummary} />
        </div>

        {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} categories={categories} />
    </div>
  );
};

export default Dashboard;

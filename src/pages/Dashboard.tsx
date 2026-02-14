import { useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatXAF, formatXAFShort, calculateResteAVivre } from "@/lib/currency";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { Skeleton } from "@/components/ui/skeleton";

const NATURE_COLORS: Record<string, string> = {
  Essential: "hsl(160, 84%, 30%)",
  Desire: "hsl(43, 74%, 49%)",
  Savings: "hsl(210, 100%, 52%)",
};

const NATURE_LABELS: Record<string, string> = {
  Essential: "Besoins (50%)",
  Desire: "Envies (30%)",
  Savings: "Épargne (20%)",
};

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const Dashboard = () => {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(currentMonth, currentYear);
  const { data: categories = [] } = useCategories();

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const monthlyIncome = useMemo(() => transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const monthlyExpenses = useMemo(() => transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);

  const expensesByNature = useMemo(() => {
    const result: Record<string, number> = { Essential: 0, Desire: 0, Savings: 0 };
    const catMap = new Map(categories.map(c => [c.id, c]));
    transactions.filter(t => t.amount < 0).forEach(t => {
      const cat = catMap.get(t.category_id);
      if (cat) result[cat.nature] += Math.abs(t.amount);
    });
    return result;
  }, [transactions, categories]);

  const resteAVivre = useMemo(
    () => calculateResteAVivre(monthlyIncome, monthlyExpenses, now.getDate()),
    [monthlyIncome, monthlyExpenses]
  );

  const donutData = Object.entries(expensesByNature)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: NATURE_LABELS[key],
      value,
      color: NATURE_COLORS[key],
    }));

  const totalExpensesForDonut = donutData.reduce((s, d) => s + d.value, 0);

  const isLoading = loadingAccounts || loadingTx;

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-36 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
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

      {/* Reste à vivre */}
      <div className="rounded-xl bg-emerald-light p-4 flex items-center justify-between animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-dark font-medium mb-0.5">
            <Calendar className="h-3.5 w-3.5" />
            Reste à vivre / jour
          </div>
          <p className="text-lg font-bold font-display text-foreground">{formatXAF(resteAVivre)}</p>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          <p>Fév. {currentYear}</p>
        </div>
      </div>

      {/* Accounts */}
      <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-sm font-semibold font-display text-muted-foreground mb-2">Mes Comptes</h2>
        {accounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun compte ajouté. Ajoutez un compte pour commencer.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="min-w-[140px] rounded-xl border border-border bg-card p-3 flex-shrink-0"
              >
                <p className="text-[11px] text-muted-foreground truncate">{acc.type}</p>
                <p className="text-sm font-semibold truncate">{acc.name}</p>
                <p className="text-sm font-bold font-display mt-1 text-primary">
                  {formatXAFShort(acc.balance)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 50/30/20 Donut */}
      {donutData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-semibold font-display mb-3">Règle 50/30/20</h2>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold">
                    {Math.round((d.value / totalExpensesForDonut) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

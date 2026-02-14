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
import {
  getTotalBalance,
  getMonthlyIncome,
  getMonthlyExpenses,
  getExpensesByNature,
  cashflowData,
  accounts,
} from "@/lib/mock-data";

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

const Dashboard = () => {
  const totalBalance = useMemo(() => getTotalBalance(), []);
  const monthlyIncome = useMemo(() => getMonthlyIncome(), []);
  const monthlyExpenses = useMemo(() => getMonthlyExpenses(), []);
  const expensesByNature = useMemo(() => getExpensesByNature(), []);
  const resteAVivre = useMemo(
    () => calculateResteAVivre(monthlyIncome, monthlyExpenses, new Date().getDate()),
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
          <p>Fév. 2026</p>
        </div>
      </div>

      {/* Accounts */}
      <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-sm font-semibold font-display text-muted-foreground mb-2">Mes Comptes</h2>
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
      </div>

      {/* 50/30/20 Donut */}
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

      {/* Cashflow Bar Chart */}
      <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "0.25s" }}>
        <h2 className="text-sm font-semibold font-display mb-3">Flux de Trésorerie</h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashflowData} barGap={2} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => formatXAFShort(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(220,13%,91%)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="income" fill="hsl(160, 84%, 30%)" radius={[4, 4, 0, 0]} name="Revenus" />
              <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            Revenus
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            Dépenses
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatXAFShort } from "@/lib/currency";

interface MonthData {
  label: string;
  income: number;
  expenses: number;
}

interface Props {
  data: MonthData[];
}

const IncomeExpenseChart = ({ data }: Props) => {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <h2 className="text-sm font-semibold font-display mb-3">Revenus vs Dépenses</h2>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value: number, name: string) => [formatXAFShort(value), name === "income" ? "Revenus" : "Dépenses"]}
              labelFormatter={(label) => label}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
            />
            <Bar dataKey="income" fill="hsl(160, 84%, 30%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Revenus
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-destructive" />
          Dépenses
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;

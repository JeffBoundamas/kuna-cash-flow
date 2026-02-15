import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatXAF } from "@/lib/currency";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
  currentBalance: number;
}

const AccountBalanceChart = ({ transactions, currentBalance }: Props) => {
  const data = useMemo(() => {
    const today = new Date();
    const days: { date: string; balance: number }[] = [];

    // Build daily deltas for last 30 days
    const deltaMap = new Map<string, number>();
    for (const tx of transactions) {
      const d = tx.date.slice(0, 10);
      deltaMap.set(d, (deltaMap.get(d) ?? 0) + tx.amount);
    }

    // Work backwards from current balance
    let bal = currentBalance;
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    dates.reverse();

    // Subtract future deltas to reconstruct past balances
    let runningBal = currentBalance;
    // First subtract all deltas from today back to compute day-30 balance
    for (let i = dates.length - 1; i >= 0; i--) {
      const delta = deltaMap.get(dates[i]) ?? 0;
      if (i < dates.length - 1) {
        // not the last date
      }
    }

    // Simpler approach: reconstruct from the end
    const balances = new Array(dates.length).fill(0);
    balances[dates.length - 1] = currentBalance;
    for (let i = dates.length - 2; i >= 0; i--) {
      const nextDayDelta = deltaMap.get(dates[i + 1]) ?? 0;
      balances[i] = balances[i + 1] - nextDayDelta;
    }

    return dates.map((date, i) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      balance: balances[i],
    }));
  }, [transactions, currentBalance]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Évolution du solde (30j)</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-card px-2 py-1 text-xs shadow-md">
                    <p className="text-muted-foreground">{payload[0].payload.date}</p>
                    <p className="font-bold font-display text-foreground">
                      {formatXAF(payload[0].value as number)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#balGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AccountBalanceChart;

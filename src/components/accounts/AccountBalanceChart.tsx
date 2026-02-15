import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { formatXAF } from "@/lib/currency";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Transaction } from "@/lib/types";

type Period = "week" | "month" | "year";

const periodConfig: Record<Period, { days: number; label: string; interval: number }> = {
  week: { days: 7, label: "7j", interval: 1 },
  month: { days: 30, label: "30j", interval: 6 },
  year: { days: 365, label: "1an", interval: 30 },
};

interface Props {
  transactions: Transaction[];
  currentBalance: number;
  threshold?: number | null;
}

const AccountBalanceChart = ({ transactions, currentBalance, threshold }: Props) => {
  const [period, setPeriod] = useState<Period>("month");
  const config = periodConfig[period];

  const data = useMemo(() => {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < config.days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    dates.reverse();

    const deltaMap = new Map<string, number>();
    for (const tx of transactions) {
      const d = tx.date.slice(0, 10);
      deltaMap.set(d, (deltaMap.get(d) ?? 0) + tx.amount);
    }

    const balances = new Array(dates.length).fill(0);
    balances[dates.length - 1] = currentBalance;
    for (let i = dates.length - 2; i >= 0; i--) {
      const nextDayDelta = deltaMap.get(dates[i + 1]) ?? 0;
      balances[i] = balances[i + 1] - nextDayDelta;
    }

    const dateFormat: Intl.DateTimeFormatOptions =
      period === "year"
        ? { month: "short" }
        : { day: "numeric", month: "short" };

    return dates.map((date, i) => ({
      date: new Date(date).toLocaleDateString("fr-FR", dateFormat),
      balance: balances[i],
    }));
  }, [transactions, currentBalance, config.days, period]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">Évolution du solde</p>
        <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v as Period)} size="sm">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <ToggleGroupItem key={p} value={p} className="text-[10px] px-2 h-6">
              {periodConfig[p].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
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
              interval={config.interval}
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
            {threshold != null && (
              <ReferenceLine
                y={threshold}
                stroke="hsl(var(--destructive))"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
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

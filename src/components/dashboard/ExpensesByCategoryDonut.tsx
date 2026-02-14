import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatXAFShort } from "@/lib/currency";
import type { Transaction, Category } from "@/lib/types";

const COLOR_MAP: Record<string, string> = {
  red: "hsl(0, 84%, 50%)",
  orange: "hsl(25, 95%, 53%)",
  amber: "hsl(38, 92%, 50%)",
  yellow: "hsl(48, 96%, 53%)",
  green: "hsl(142, 71%, 45%)",
  emerald: "hsl(160, 84%, 30%)",
  blue: "hsl(210, 100%, 52%)",
  indigo: "hsl(235, 60%, 50%)",
  violet: "hsl(270, 60%, 55%)",
  rose: "hsl(340, 75%, 55%)",
};

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

const ExpensesByCategoryDonut = ({ transactions, categories }: Props) => {
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const byCategory: Record<string, { name: string; color: string; value: number }> = {};
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      const cat = catMap.get(t.category_id);
      if (!cat) return;
      if (!byCategory[cat.id]) {
        byCategory[cat.id] = { name: cat.name, color: COLOR_MAP[cat.color] || COLOR_MAP.blue, value: 0 };
      }
      byCategory[cat.id].value += Math.abs(t.amount);
    });

  const data = Object.values(byCategory)
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
      <h2 className="text-sm font-semibold font-display mb-3">Dépenses par catégorie</h2>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 max-h-28 overflow-y-auto">
          {data.slice(0, 6).map((d) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground truncate">{d.name}</span>
              </div>
              <span className="font-semibold ml-2 whitespace-nowrap">{formatXAFShort(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpensesByCategoryDonut;

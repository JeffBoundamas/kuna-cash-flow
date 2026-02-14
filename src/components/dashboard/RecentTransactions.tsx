import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/currency";
import type { Transaction, Category } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AddTransactionSheet from "@/components/transactions/AddTransactionSheet";

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

const RecentTransactions = ({ transactions, categories }: Props) => {
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const recent = transactions.slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "0.25s" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold font-display">Dernières transactions</h2>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)} className="h-7 w-7 p-0">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate("/transactions")} className="h-7 text-xs px-2">
            Voir tout
          </Button>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Aucune transaction ce mois-ci.</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((tx) => {
            const cat = catMap.get(tx.category_id);
            const color = cat ? (COLOR_MAP[cat.color] || COLOR_MAP.blue) : COLOR_MAP.blue;
            return (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: color }}>
                    {(cat?.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.label || cat?.name || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(tx.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold font-display whitespace-nowrap ${tx.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                  {tx.amount >= 0 ? "+" : ""}{formatXAF(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <AddTransactionSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
};

export default RecentTransactions;

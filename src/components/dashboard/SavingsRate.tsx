import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SavingsRateProps {
  monthlyIncome: number;
  monthlyExpenses: number;
}

const SavingsRate = ({ monthlyIncome, monthlyExpenses }: SavingsRateProps) => {
  const rate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;
  const clampedRate = Math.max(0, Math.min(100, rate));

  const getColor = () => {
    if (rate >= 20) return "text-primary";
    if (rate >= 10) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <TrendingUp className="h-3.5 w-3.5" />
          Taux d'épargne mensuel
        </div>
        <span className={`text-lg font-bold font-display ${getColor()}`}>{rate}%</span>
      </div>
      <Progress value={clampedRate} className="h-2" />
      <p className="text-[11px] text-muted-foreground mt-1.5">
        {rate >= 20 ? "Excellent ! Objectif 20% atteint 🎉" : rate >= 10 ? "Pas mal, visez les 20% !" : "Attention, essayez d'épargner davantage."}
      </p>
    </div>
  );
};

export default SavingsRate;

import { useMemo } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Landmark, ShieldCheck } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useObligations } from "@/hooks/use-obligations";

interface Props {
  totalBalance: number;
}

const TresorerieCard = ({ totalBalance }: Props) => {
  const { data: obligations = [] } = useObligations();

  const { engagements, creancesCertaines, tresorerieReelle, tresoreriePrudente } = useMemo(() => {
    let eng = 0;
    let cert = 0;
    obligations.forEach(o => {
      if (o.status !== "active" && o.status !== "partially_paid") return;
      if (o.type === "engagement") eng += o.remaining_amount;
      if (o.type === "creance" && o.confidence === "certain") cert += o.remaining_amount;
    });
    return {
      engagements: eng,
      creancesCertaines: cert,
      tresorerieReelle: totalBalance - eng + cert,
      tresoreriePrudente: totalBalance - eng,
    };
  }, [obligations, totalBalance]);

  // Don't render if there are no obligations
  if (engagements === 0 && creancesCertaines === 0) return null;

  const isNegative = tresorerieReelle < 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 animate-fade-in" style={{ animationDelay: "0.08s" }}>
      <div className="flex items-center gap-2 mb-1">
        <Landmark className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold font-display">Trésorerie réelle</h3>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Solde visible</span>
        <span className="font-medium">{formatXAF(totalBalance)}</span>
      </div>

      {engagements > 0 && (
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingDown className="h-3 w-3 text-destructive" />
            Engagements
          </span>
          <span className="font-medium text-destructive">-{formatXAF(engagements)}</span>
        </div>
      )}

      {creancesCertaines > 0 && (
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            Créances certaines
          </span>
          <span className="font-medium text-emerald-600">+{formatXAF(creancesCertaines)}</span>
        </div>
      )}

      <div className="border-t border-border pt-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">Trésorerie réelle</span>
          <span className={cn(
            "text-base font-bold font-display flex items-center gap-1",
            isNegative ? "text-destructive" : "text-primary"
          )}>
            {isNegative && <AlertTriangle className="h-4 w-4" />}
            {formatXAF(tresorerieReelle)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Trésorerie prudente
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {formatXAF(tresoreriePrudente)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TresorerieCard;

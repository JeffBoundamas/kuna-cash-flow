import { useMemo } from "react";
import { CalendarClock, Check } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { useFixedCharges, isChargePayedThisPeriod } from "@/hooks/use-fixed-charges";
import { useObligations } from "@/hooks/use-obligations";
import { useNavigate } from "react-router-dom";

const ChargesDuMoisWidget = () => {
  const { data: charges = [] } = useFixedCharges();
  const { data: obligations = [] } = useObligations();
  const navigate = useNavigate();

  const activeCharges = useMemo(() => charges.filter(c => c.is_active), [charges]);

  const { paid, total, remaining, nextCharge } = useMemo(() => {
    let p = 0, t = 0, rem = 0;
    let next: { name: string; dueDay: number } | null = null;
    const today = new Date().getDate();

    activeCharges.forEach(c => {
      if (c.frequency !== "monthly") return; // Only monthly for this widget
      t++;
      const status = isChargePayedThisPeriod(c, obligations);
      if (status === "paid") p++;
      else {
        rem += c.amount;
        if (!next || c.due_day >= today) {
          if (!next || c.due_day < (next.dueDay < today ? 32 : next.dueDay)) {
            next = { name: c.name, dueDay: c.due_day };
          }
        }
      }
    });
    return { paid: p, total: t, remaining: rem, nextCharge: next };
  }, [activeCharges, obligations]);

  if (total === 0) return null;

  return (
    <button
      onClick={() => navigate("/fixed-charges")}
      className="rounded-xl border border-border bg-card p-4 space-y-2 animate-fade-in text-left w-full hover:shadow-sm transition-shadow"
      style={{ animationDelay: "0.1s" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold font-display">Charges du mois</h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs text-muted-foreground">{paid}/{total} payées</span>
        </div>
        <div className="w-16 bg-muted rounded-full h-1.5">
          <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${(paid / total) * 100}%` }} />
        </div>
      </div>

      {remaining > 0 && (
        <p className="text-xs text-muted-foreground">
          Reste : <span className="font-semibold text-foreground">{formatXAF(remaining)}</span>
        </p>
      )}

      {nextCharge && (
        <p className="text-[11px] text-muted-foreground">
          Prochaine : {(nextCharge as any).name} le {(nextCharge as any).dueDay}
        </p>
      )}
    </button>
  );
};

export default ChargesDuMoisWidget;

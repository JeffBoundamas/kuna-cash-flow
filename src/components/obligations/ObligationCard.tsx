import { cn } from "@/lib/utils";
import { formatXAF } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Obligation } from "@/lib/obligation-types";

interface Props {
  obligation: Obligation;
  onTap: () => void;
}

const confidenceConfig = {
  certain: { label: "Certain", className: "bg-emerald-100 text-emerald-700" },
  probable: { label: "Probable", className: "bg-amber-100 text-amber-700" },
  uncertain: { label: "Incertain", className: "bg-red-100 text-red-700" },
};

const getDueDateColor = (dueDate: string | null) => {
  if (!dueDate) return "text-muted-foreground";
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "text-destructive font-semibold";
  if (diff < 14) return "text-amber-600";
  return "text-muted-foreground";
};

const ObligationCard = ({ obligation: ob, onTap }: Props) => {
  const isCreance = ob.type === "creance";
  const paidPercent = ob.total_amount > 0
    ? Math.round(((ob.total_amount - ob.remaining_amount) / ob.total_amount) * 100)
    : 0;
  const isPartial = ob.status === "partially_paid";

  return (
    <button
      onClick={onTap}
      className={cn(
        "w-full text-left rounded-xl border bg-card p-4 transition-all hover:shadow-sm active:scale-[0.99]",
        isCreance ? "border-l-4 border-l-emerald-500 border-border" : "border-l-4 border-l-destructive border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{ob.person_name}</p>
          {ob.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{ob.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {ob.linked_tontine_id && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] h-4 px-1.5">Tontine</Badge>
            )}
            {ob.linked_fixed_charge_id && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px] h-4 px-1.5">Charge fixe</Badge>
            )}
            {ob.linked_savings_goal_id && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] h-4 px-1.5">Épargne</Badge>
            )}
            {ob.due_date && (
              <span className={cn("text-[11px]", getDueDateColor(ob.due_date))}>
                Échéance : {new Date(ob.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {isCreance && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", confidenceConfig[ob.confidence].className)}>
                {confidenceConfig[ob.confidence].label}
              </span>
            )}
          </div>
        </div>
        <p className={cn(
          "text-sm font-bold font-display whitespace-nowrap",
          isCreance ? "text-emerald-600" : "text-destructive"
        )}>
          {isCreance ? "+" : "-"}{formatXAF(ob.remaining_amount)}
        </p>
      </div>

      {isPartial && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Payé {paidPercent}%</span>
            <span>{formatXAF(ob.total_amount - ob.remaining_amount)} / {formatXAF(ob.total_amount)}</span>
          </div>
          <Progress value={paidPercent} className="h-1.5" />
        </div>
      )}
    </button>
  );
};

export default ObligationCard;

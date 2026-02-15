import { icons, ShieldCheck } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { METHOD_TYPE_LABELS } from "@/lib/payment-method-types";
import type { PaymentMethod } from "@/lib/payment-method-types";

interface Props {
  pm: PaymentMethod;
  onTap: () => void;
}

const PaymentMethodCard = ({ pm, onTap }: Props) => {
  const LucideIcon = (icons as any)[pm.icon] || (icons as any)["Wallet"];

  return (
    <button
      onClick={onTap}
      className={cn(
        "w-full rounded-2xl border bg-card p-4 text-left transition-all hover:shadow-md active:scale-[0.98]",
        !pm.is_active && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
          style={{ backgroundColor: pm.color + "20" }}
        >
          <LucideIcon className="h-5 w-5" style={{ color: pm.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold font-display truncate">{pm.name}</p>
            {!pm.allow_negative_balance && (
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {METHOD_TYPE_LABELS[pm.method_type] || pm.method_type}
          </p>
        </div>

        <p className={cn(
          "text-sm font-bold font-display whitespace-nowrap",
          pm.initial_balance >= 0 ? "text-primary" : "text-destructive"
        )}>
          {formatXAF(pm.initial_balance)}
        </p>
      </div>
    </button>
  );
};

export default PaymentMethodCard;

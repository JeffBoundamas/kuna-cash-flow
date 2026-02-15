import { icons } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatXAF } from "@/lib/currency";
import type { PaymentMethod } from "@/lib/payment-method-types";

interface Props {
  methods: (PaymentMethod & { currentBalance: number })[];
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
}

const PaymentMethodPicker = ({ methods, selectedId, onSelect, label = "Moyen de paiement" }: Props) => {
  if (methods.length === 0) {
    return <p className="text-xs text-muted-foreground">Aucun moyen de paiement configuré.</p>;
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide max-w-full">
        {methods.map((pm) => {
          const Icon = (icons as any)[pm.icon] || (icons as any)["Wallet"];
          const isSelected = selectedId === pm.id;
          return (
            <button
              key={pm.id}
              onClick={() => onSelect(pm.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0"
                style={{ backgroundColor: pm.color + "20" }}
              >
                <Icon className="h-3 w-3" style={{ color: pm.color }} />
              </div>
              <div className="text-left">
                <span className="block leading-tight">{pm.name}</span>
                <span className="block text-[10px] opacity-70">{formatXAF(pm.currentBalance)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodPicker;

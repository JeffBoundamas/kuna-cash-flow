import { cn } from "@/lib/utils";
import { Repeat } from "lucide-react";
import type { RecurringFrequency } from "@/hooks/use-recurring-transactions";

interface RecurringToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  frequency: RecurringFrequency;
  onFrequencyChange: (f: RecurringFrequency) => void;
}

const frequencies: { value: RecurringFrequency; label: string }[] = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdo" },
  { value: "monthly", label: "Mensuel" },
];

const RecurringToggle = ({ enabled, onToggle, frequency, onFrequencyChange }: RecurringToggleProps) => {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all w-full",
          enabled
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground"
        )}
      >
        <Repeat className="h-3.5 w-3.5" />
        Transaction récurrente
      </button>

      {enabled && (
        <div className="flex gap-1.5">
          {frequencies.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFrequencyChange(f.value)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-medium transition-all",
                frequency === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringToggle;

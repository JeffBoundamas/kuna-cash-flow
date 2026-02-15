import { cn } from "@/lib/utils";

export type NatureFilter = "all" | "income" | "expense";

export interface TransactionFilters {
  nature: NatureFilter;
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  accountId: string;
}

const emptyFilters: TransactionFilters = {
  nature: "all",
  dateFrom: "",
  dateTo: "",
  categoryId: "",
  accountId: "",
};

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  onChange: (f: TransactionFilters) => void;
}

const natureOptions: { value: NatureFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "income", label: "Revenus" },
  { value: "expense", label: "Dépenses" },
];

const TransactionFilterBar = ({ filters, onChange }: TransactionFilterBarProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-border overflow-hidden">
        {natureOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, nature: opt.value, categoryId: "" })}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-all",
              filters.nature === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export { emptyFilters };
export default TransactionFilterBar;

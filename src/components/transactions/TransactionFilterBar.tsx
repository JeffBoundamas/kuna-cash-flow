import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account, Category } from "@/lib/types";

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
  accounts: Account[];
  categories: Category[];
}

const natureOptions: { value: NatureFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "income", label: "Revenus" },
  { value: "expense", label: "Dépenses" },
];

const TransactionFilterBar = ({ filters, onChange, accounts, categories }: TransactionFilterBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasFilters = filters.dateFrom || filters.dateTo || filters.categoryId || filters.accountId || filters.nature !== "all";

  // Filter categories based on selected nature
  const visibleCategories = categories.filter((c) => {
    if (filters.nature === "income") return c.type === "Income";
    if (filters.nature === "expense") return c.type === "Expense";
    return true;
  });

  return (
    <div className="space-y-2">
      {/* Primary nature filter */}
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

        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ml-auto",
            hasFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtres
          {hasFilters && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(emptyFilters); }}
              className="ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {expanded && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-3 animate-fade-in">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Du</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Au</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Account filter */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Compte</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => onChange({ ...filters, accountId: "" })}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all",
                  !filters.accountId ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                Tous
              </button>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onChange({ ...filters, accountId: acc.id })}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all",
                    filters.accountId === acc.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Catégorie</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onChange({ ...filters, categoryId: "" })}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all",
                  !filters.categoryId ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                Toutes
              </button>
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onChange({ ...filters, categoryId: cat.id })}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all",
                    filters.categoryId === cat.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { emptyFilters };
export default TransactionFilterBar;

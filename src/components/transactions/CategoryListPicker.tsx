import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, CategoryNature } from "@/lib/types";

const NATURE_LABELS: Record<CategoryNature, string> = {
  Essential: "Essentiel",
  Desire: "Désir",
  Savings: "Épargne",
};

const NATURE_DOT: Record<CategoryNature, string> = {
  Essential: "bg-blue-500",
  Desire: "bg-amber-500",
  Savings: "bg-emerald-500",
};

interface Props {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  suggestedId?: string | null;
}

const CategoryListPicker = ({ categories, selectedId, onSelect, suggestedId }: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Aucune catégorie disponible.</p>;
  }

  const selectedCat = categories.find((c) => c.id === selectedId);
  const suggestedCat = !selectedId && suggestedId ? categories.find((c) => c.id === suggestedId) : null;
  const displayCat = selectedCat || suggestedCat;

  return (
    <div className="space-y-1">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center justify-between w-full rounded-xl border px-4 py-2.5 text-sm transition-colors",
          selectedCat
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border bg-background text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {displayCat && (
            <span className={cn("h-2 w-2 rounded-full flex-shrink-0", NATURE_DOT[displayCat.nature])} />
          )}
          <span className="truncate">
            {selectedCat ? selectedCat.name : suggestedCat ? `${suggestedCat.name} (suggestion)` : "Choisir une catégorie"}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>

      {/* Expandable list */}
      {expanded && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border max-h-48 overflow-y-auto">
          {categories.map((cat) => {
            const isSelected = selectedId === cat.id;
            const isSuggested = suggestedId === cat.id && !selectedId;
            return (
              <button
                key={cat.id}
                onClick={() => { onSelect(cat.id); setExpanded(false); }}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-2.5 text-left transition-colors",
                  isSelected
                    ? "bg-primary/10"
                    : isSuggested
                    ? "bg-accent/50"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={cn("h-2 w-2 rounded-full flex-shrink-0", NATURE_DOT[cat.nature])} />
                  <span className={cn(
                    "text-sm truncate",
                    isSelected ? "font-semibold text-primary" : "text-foreground"
                  )}>
                    {cat.name}
                  </span>
                  {isSuggested && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      suggestion
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {NATURE_LABELS[cat.nature]}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryListPicker;

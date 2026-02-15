import { useState, useMemo } from "react";
import { Plus, HandCoins, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatXAF } from "@/lib/currency";
import { useObligations } from "@/hooks/use-obligations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ObligationCard from "./ObligationCard";
import ObligationDetail from "./ObligationDetail";
import AddObligationSheet from "./AddObligationSheet";
import type { Obligation, ObligationType } from "@/lib/obligation-types";

const CreancesTab = () => {
  const [subTab, setSubTab] = useState<ObligationType>("creance");
  const [selected, setSelected] = useState<Obligation | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { data: obligations = [], isLoading } = useObligations();

  const active = useMemo(
    () => obligations.filter(o => o.type === subTab && (o.status === "active" || o.status === "partially_paid")),
    [obligations, subTab]
  );

  const settled = useMemo(
    () => obligations.filter(o => o.type === subTab && (o.status === "settled" || o.status === "cancelled")),
    [obligations, subTab]
  );

  const totalRemaining = useMemo(
    () => active.reduce((s, o) => s + o.remaining_amount, 0),
    [active]
  );

  const byCertainty = useMemo(() => {
    if (subTab !== "creance") return null;
    const groups = { certain: 0, probable: 0, uncertain: 0 };
    active.forEach(o => { groups[o.confidence] += o.remaining_amount; });
    return groups;
  }, [active, subTab]);

  // Use fresh data from query instead of stale selected snapshot
  const freshSelected = selected ? obligations.find(o => o.id === selected.id) ?? selected : null;

  if (freshSelected) {
    return <ObligationDetail obligation={freshSelected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {/* Sub-tab toggle */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        <button
          onClick={() => setSubTab("creance")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
            subTab === "creance" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground"
          )}
        >
          <HandCoins className="h-4 w-4" />
          On me doit
        </button>
        <button
          onClick={() => setSubTab("engagement")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
            subTab === "engagement" ? "bg-destructive text-destructive-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Banknote className="h-4 w-4" />
          Je dois
        </button>
      </div>

      {/* Summary */}
      <div className={cn(
        "rounded-xl p-4 border",
        subTab === "creance" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
      )}>
        <p className="text-xs text-muted-foreground mb-0.5">
          {subTab === "creance" ? "Total des créances actives" : "Total des engagements actifs"}
        </p>
        <p className={cn(
          "text-xl font-bold font-display",
          subTab === "creance" ? "text-emerald-600" : "text-destructive"
        )}>
          {formatXAF(totalRemaining)}
        </p>
        {byCertainty && totalRemaining > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Certain : {formatXAF(byCertainty.certain)} · Probable : {formatXAF(byCertainty.probable)} · Incertain : {formatXAF(byCertainty.uncertain)}
          </p>
        )}
        {subTab === "engagement" && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {active.length} engagement{active.length > 1 ? "s" : ""} actif{active.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : active.length === 0 && settled.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            {subTab === "creance"
              ? <HandCoins className="h-8 w-8 text-muted-foreground" />
              : <Banknote className="h-8 w-8 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {subTab === "creance" ? "Aucune créance enregistrée" : "Aucun engagement enregistré"}
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map(o => (
                <ObligationCard key={o.id} obligation={o} onTap={() => setSelected(o)} />
              ))}
            </div>
          )}

          {settled.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                Historique
              </p>
              <div className="space-y-2 opacity-60">
                {settled.map(o => (
                  <ObligationCard key={o.id} obligation={o} onTap={() => setSelected(o)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className={cn(
          "fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90",
          subTab === "creance" ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"
        )}
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddObligationSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        defaultType={subTab}
      />
    </div>
  );
};

export default CreancesTab;

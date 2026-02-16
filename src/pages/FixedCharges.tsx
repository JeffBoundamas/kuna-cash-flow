import { useState, useMemo } from "react";
import { Plus, CalendarClock, Check, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatXAF } from "@/lib/currency";
import { useFixedCharges, isChargePayedThisPeriod } from "@/hooks/use-fixed-charges";
import { useObligations } from "@/hooks/use-obligations";
import { useCategories } from "@/hooks/use-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddFixedChargeSheet from "@/components/fixed-charges/AddFixedChargeSheet";
import EditFixedChargeSheet from "@/components/fixed-charges/EditFixedChargeSheet";
import PayFixedChargeSheet from "@/components/fixed-charges/PayFixedChargeSheet";
import type { FixedCharge } from "@/lib/fixed-charge-types";
import { frequencyLabels } from "@/lib/fixed-charge-types";

const FixedCharges = () => {
  const { data: charges = [], isLoading } = useFixedCharges();
  const { data: obligations = [] } = useObligations();
  const { data: categories = [] } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<FixedCharge | null>(null);
  const [paying, setPaying] = useState<FixedCharge | null>(null);

  const activeCharges = useMemo(() => charges.filter(c => c.is_active), [charges]);

  const summary = useMemo(() => {
    let paid = 0;
    let total = 0;
    let remaining = 0;
    activeCharges.forEach(c => {
      total++;
      const status = isChargePayedThisPeriod(c, obligations);
      if (status === "paid") paid++;
      else remaining += c.amount;
    });
    return { paid, total, remaining };
  }, [activeCharges, obligations]);

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 pt-6 pb-24 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold font-display">Charges fixes</h1>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Summary card */}
      {activeCharges.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Ce mois</p>
            <Badge variant="secondary" className="text-xs">
              {summary.paid}/{summary.total} payées
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${summary.total > 0 ? (summary.paid / summary.total) * 100 : 0}%` }}
            />
          </div>
          {summary.remaining > 0 && (
            <p className="text-xs text-muted-foreground">
              Reste à payer : <span className="font-semibold text-foreground">{formatXAF(summary.remaining)}</span>
            </p>
          )}
        </div>
      )}

      {/* Charges list */}
      {activeCharges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">Aucune charge fixe configurée</p>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Ajouter une charge
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {activeCharges.map(charge => {
            const status = isChargePayedThisPeriod(charge, obligations);
            const cat = categories.find(c => c.id === charge.category_id);
            return (
              <div
                key={charge.id}
                className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => setEditing(charge)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate">{charge.name}</p>
                    <p className="text-lg font-bold font-display text-primary mt-0.5">{formatXAF(charge.amount)}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {frequencyLabels[charge.frequency]}
                      </Badge>
                      {cat && (
                        <span className="text-[10px] text-muted-foreground">{cat.name}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Échéance le {charge.due_day} de chaque mois
                    </p>
                  </button>
                  <div className="flex flex-col items-end gap-2">
                    {status === "paid" && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] gap-1">
                        <Check className="h-3 w-3" />
                        Payé
                      </Badge>
                    )}
                    {status === "due" && (
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] gap-1">
                        <Clock className="h-3 w-3" />
                        À payer
                      </Badge>
                    )}
                    {status === "overdue" && (
                      <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        En retard
                      </Badge>
                    )}
                    {status !== "paid" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 text-xs"
                        onClick={() => setPaying(charge)}
                      >
                        Payer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddFixedChargeSheet open={showAdd} onOpenChange={setShowAdd} />
      <EditFixedChargeSheet charge={editing} onClose={() => setEditing(null)} />
      <PayFixedChargeSheet charge={paying} onClose={() => setPaying(null)} />
    </div>
  );
};

export default FixedCharges;

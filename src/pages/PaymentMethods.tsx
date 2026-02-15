import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  usePaymentMethods, useUpdatePaymentMethod, PaymentMethod,
  TYPE_LABELS, getTypeFromCategory,
} from "@/hooks/use-payment-methods";
import { ICONS } from "@/components/payment-methods/IconPicker";
import AddPaymentMethodSheet from "@/components/payment-methods/AddPaymentMethodSheet";
import EditPaymentMethodSheet from "@/components/payment-methods/EditPaymentMethodSheet";
import { formatXAF } from "@/lib/currency";

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { data: methods = [], isLoading } = usePaymentMethods();
  const updateMutation = useUpdatePaymentMethod();
  const [addOpen, setAddOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);

  const active = methods.filter((m) => m.is_active);
  const inactive = methods.filter((m) => !m.is_active);

  const toggleActive = (m: PaymentMethod) => {
    updateMutation.mutate({ id: m.id, is_active: !m.is_active });
  };

  const renderCard = (m: PaymentMethod) => {
    const IconComp = ICONS.find((i) => i.name === m.icon)?.component;
    const typeLabel = TYPE_LABELS[getTypeFromCategory(m.category)] || m.category;

    return (
      <div
        key={m.id}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card transition-opacity ${
          !m.is_active ? "opacity-50" : ""
        }`}
      >
        {/* Icon */}
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: m.color }}
        >
          {IconComp && <IconComp className="h-5 w-5 text-white" />}
        </div>

        {/* Info */}
        <button className="flex-1 text-left min-w-0" onClick={() => setEditMethod(m)}>
          <p className="text-sm font-semibold truncate">{m.name}</p>
          <p className="text-xs text-muted-foreground">{typeLabel}</p>
        </button>

        {/* Balance + indicators */}
        <div className="flex items-center gap-2 shrink-0">
          {!m.allow_negative_balance && (
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={`text-sm font-semibold tabular-nums ${
            m.initial_balance >= 0 ? "text-emerald-500" : "text-red-500"
          }`}>
            {formatXAF(m.initial_balance)}
          </span>
        </div>

        {/* Active toggle */}
        <Switch
          checked={m.is_active}
          onCheckedChange={() => toggleActive(m)}
          className="shrink-0"
        />
      </div>
    );
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold font-display">Moyens de paiement</h1>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {active.map(renderCard)}
          </div>

          {inactive.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Inactifs
              </p>
              {inactive.map(renderCard)}
            </div>
          )}

          {methods.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aucun moyen de paiement. Ajoutez-en un pour commencer.
            </div>
          )}
        </>
      )}

      <AddPaymentMethodSheet open={addOpen} onOpenChange={setAddOpen} />
      <EditPaymentMethodSheet open={!!editMethod} onOpenChange={(o) => !o && setEditMethod(null)} method={editMethod} />
    </div>
  );
};

export default PaymentMethods;

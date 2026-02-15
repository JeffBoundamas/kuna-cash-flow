import { useState, useMemo } from "react";
import { Plus, GripVertical } from "lucide-react";
import { usePaymentMethods, useReorderPaymentMethods, useUpdatePaymentMethod } from "@/hooks/use-payment-methods";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentMethodCard from "@/components/payment-methods/PaymentMethodCard";
import PaymentMethodSheet from "@/components/payment-methods/PaymentMethodSheet";
import type { PaymentMethod } from "@/lib/payment-method-types";

const PaymentMethods = () => {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const reorder = useReorderPaymentMethods();
  const updatePM = useUpdatePaymentMethod();

  const [showSheet, setShowSheet] = useState(false);
  const [editItem, setEditItem] = useState<PaymentMethod | null>(null);

  const sorted = useMemo(() => {
    const active = methods.filter((m) => m.is_active).sort((a, b) => a.sort_order - b.sort_order);
    const inactive = methods.filter((m) => !m.is_active).sort((a, b) => a.sort_order - b.sort_order);
    return [...active, ...inactive];
  }, [methods]);

  const nextSortOrder = methods.length > 0 ? Math.max(...methods.map((m) => m.sort_order)) + 1 : 1;

  const handleEdit = (pm: PaymentMethod) => {
    setEditItem(pm);
    setShowSheet(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setShowSheet(true);
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Moyens de paiement</h1>
        <button
          onClick={handleAdd}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="Ajouter un moyen de paiement"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">Aucun moyen de paiement configuré.</p>
          <button onClick={handleAdd} className="text-sm font-medium text-primary">
            + Ajouter un moyen de paiement
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((pm) => (
            <PaymentMethodCard key={pm.id} pm={pm} onTap={() => handleEdit(pm)} />
          ))}
        </div>
      )}

      {sorted.some((m) => !m.is_active) && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Les moyens désactivés apparaissent en bas de la liste
        </p>
      )}

      <PaymentMethodSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        editItem={editItem}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
};

export default PaymentMethods;

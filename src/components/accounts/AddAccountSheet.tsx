import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddAccount } from "@/hooks/use-accounts";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { formatXAF, parseAmount } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AccountType } from "@/lib/types";

const CATEGORY_LABELS: Record<AccountType, string> = {
  Bank: "Banque",
  "Mobile Money": "Mobile Money",
  Cash: "Cash",
  Tontine: "Tontine",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddAccountSheet = ({ open, onOpenChange }: Props) => {
  const addAccount = useAddAccount();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [name, setName] = useState("");
  const [balanceStr, setBalanceStr] = useState("");

  const grouped = useMemo(() => {
    const groups: Record<AccountType, typeof paymentMethods> = {
      Bank: [],
      "Mobile Money": [],
      Cash: [],
      Tontine: [],
    };
    paymentMethods.forEach((m) => {
      if (groups[m.category]) groups[m.category].push(m);
    });
    return Object.entries(groups).filter(([, methods]) => methods.length > 0) as [AccountType, typeof paymentMethods][];
  }, [paymentMethods]);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  const reset = () => {
    setName("");
    setSelectedMethodId("");
    setBalanceStr("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Veuillez saisir un nom de compte");
      return;
    }
    if (!selectedMethod) {
      toast.error("Veuillez choisir un moyen de paiement");
      return;
    }
    addAccount.mutate(
      {
        name: name.trim(),
        type: selectedMethod.category,
        balance: parseAmount(balanceStr),
        icon: selectedMethod.icon,
      },
      {
        onSuccess: () => {
          toast.success("Compte ajouté !");
          reset();
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur lors de la création du compte"),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nouveau compte</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nom du compte</Label>
            <Input
              placeholder="Ex: Mon compte BICEC, Orange Money..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Payment method picker grouped by category */}
          <div className="space-y-3">
            <Label>Moyen de paiement</Label>
            {grouped.map(([category, methods]) => (
              <div key={category}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {CATEGORY_LABELS[category]}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                        selectedMethodId === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      )}
                    >
                      <span>{m.icon}</span> {m.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {paymentMethods.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Aucun moyen de paiement configuré. Allez dans Paramètres → Moyens de paiement.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Solde initial (XAF)</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
            />
            {parseAmount(balanceStr) > 0 && (
              <p className="text-xs text-muted-foreground">{formatXAF(parseAmount(balanceStr))}</p>
            )}
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={addAccount.isPending}>
            Créer le compte
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddAccountSheet;

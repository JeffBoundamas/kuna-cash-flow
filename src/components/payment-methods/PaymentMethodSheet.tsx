import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { icons } from "lucide-react";
import { toast } from "sonner";
import { useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/use-payment-methods";
import { formatXAF, parseAmount } from "@/lib/currency";
import {
  METHOD_TYPE_LABELS,
  METHOD_TYPE_DEFAULTS,
  COLOR_OPTIONS,
  type PaymentMethod,
  type PaymentMethodType,
} from "@/lib/payment-method-types";
import IconPicker from "./IconPicker";
import ColorPicker from "./ColorPicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: PaymentMethod | null;
  nextSortOrder: number;
  transactionCount?: number;
}

const PaymentMethodSheet = ({ open, onOpenChange, editItem, nextSortOrder, transactionCount = 0 }: Props) => {
  const addPM = useAddPaymentMethod();
  const updatePM = useUpdatePaymentMethod();
  const deletePM = useDeletePaymentMethod();

  const [name, setName] = useState("");
  const [methodType, setMethodType] = useState<PaymentMethodType>("cash");
  const [icon, setIcon] = useState("Banknote");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [balanceStr, setBalanceStr] = useState("");
  const [allowNegative, setAllowNegative] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (open && editItem) {
      setName(editItem.name);
      setMethodType(editItem.method_type);
      setIcon(editItem.icon);
      setColor(editItem.color);
      setBalanceStr(String(editItem.initial_balance || ""));
      setAllowNegative(editItem.allow_negative_balance);
    } else if (open) {
      setName("");
      setMethodType("cash");
      setIcon("Banknote");
      setColor(COLOR_OPTIONS[0]);
      setBalanceStr("");
      setAllowNegative(false);
    }
  }, [open, editItem]);

  const handleTypeChange = (t: PaymentMethodType) => {
    setMethodType(t);
    if (!editItem) {
      setAllowNegative(METHOD_TYPE_DEFAULTS[t].allowNegative);
    }
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Veuillez saisir un nom"); return; }

    const payload = {
      name: name.trim(),
      method_type: methodType,
      icon,
      color,
      allow_negative_balance: allowNegative,
      initial_balance: parseAmount(balanceStr),
      is_active: true,
      sort_order: editItem?.sort_order ?? nextSortOrder,
    };

    if (editItem) {
      updatePM.mutate({ id: editItem.id, ...payload }, {
        onSuccess: () => { toast.success("Moyen de paiement modifié"); onOpenChange(false); },
        onError: () => toast.error("Erreur lors de la modification"),
      });
    } else {
      addPM.mutate(payload, {
        onSuccess: () => { toast.success("Moyen de paiement ajouté !"); onOpenChange(false); },
        onError: () => toast.error("Erreur lors de la création"),
      });
    }
  };

  const handleDelete = () => {
    if (!editItem) return;
    if (transactionCount > 0) {
      toast.error(`Ce moyen de paiement est utilisé dans ${transactionCount} transactions. Vous pouvez le désactiver mais pas le supprimer.`);
      return;
    }
    deletePM.mutate(editItem.id, {
      onSuccess: () => { toast.success("Moyen de paiement supprimé"); onOpenChange(false); },
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  };

  const handleDeactivate = () => {
    if (!editItem) return;
    updatePM.mutate({ id: editItem.id, is_active: false }, {
      onSuccess: () => { toast.success("Moyen de paiement désactivé"); onOpenChange(false); },
    });
  };

  const SelectedIcon = (icons as any)[icon] || (icons as any)["Wallet"];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editItem ? "Modifier" : "Nouveau"} moyen de paiement</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-4 pb-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input placeholder="Ex: BGFIBank, Airtel Money..." value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={methodType} onValueChange={(v) => handleTypeChange(v as PaymentMethodType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Icône</Label>
              <button
                onClick={() => setShowIconPicker(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors w-full"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: color + "20" }}>
                  <SelectedIcon className="h-4 w-4" style={{ color }} />
                </div>
                <span className="text-sm text-muted-foreground">Changer l'icône</span>
              </button>
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="space-y-2">
              <Label>Solde initial (FCFA)</Label>
              <Input type="number" inputMode="numeric" placeholder="0" value={balanceStr} onChange={(e) => setBalanceStr(e.target.value)} />
              {parseAmount(balanceStr) > 0 && (
                <p className="text-xs text-muted-foreground">{formatXAF(parseAmount(balanceStr))}</p>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Autoriser le solde négatif</Label>
                <p className="text-[11px] text-muted-foreground max-w-[240px]">
                  {allowNegative
                    ? "Le solde pourra devenir négatif (découvert autorisé)"
                    : "Les transactions seront bloquées si le solde est insuffisant"}
                </p>
              </div>
              <Switch checked={allowNegative} onCheckedChange={setAllowNegative} />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={addPM.isPending || updatePM.isPending}>
              {editItem ? "Enregistrer" : "Créer"}
            </Button>

            {editItem && (
              <div className="space-y-2 pt-2 border-t border-border">
                {transactionCount > 0 ? (
                  <Button variant="outline" className="w-full" onClick={handleDeactivate}>
                    Désactiver
                  </Button>
                ) : (
                  <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={deletePM.isPending}>
                    Supprimer
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <IconPicker open={showIconPicker} onOpenChange={setShowIconPicker} value={icon} onChange={setIcon} />
    </>
  );
};

export default PaymentMethodSheet;

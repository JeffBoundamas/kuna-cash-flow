import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAddPaymentMethod, TYPE_LABELS } from "@/hooks/use-payment-methods";
import IconPicker, { ICONS } from "./IconPicker";
import ColorPicker from "./ColorPicker";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_ICONS: Record<string, string> = {
  cash: "Banknote",
  bank_account: "Building2",
  mobile_money: "Smartphone",
  credit_card: "CreditCard",
  check: "FileText",
};

const DEFAULT_NEGATIVE: Record<string, boolean> = {
  cash: false,
  bank_account: true,
  mobile_money: false,
  credit_card: true,
  check: true,
};

const AddPaymentMethodSheet = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [icon, setIcon] = useState("Banknote");
  const [color, setColor] = useState("#22C55E");
  const [initialBalance, setInitialBalance] = useState("");
  const [allowNegative, setAllowNegative] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const addMutation = useAddPaymentMethod();

  useEffect(() => {
    if (open) {
      setName("");
      setType("cash");
      setIcon("Banknote");
      setColor("#22C55E");
      setInitialBalance("");
      setAllowNegative(false);
    }
  }, [open]);

  useEffect(() => {
    setIcon(DEFAULT_ICONS[type] || "Banknote");
    setAllowNegative(DEFAULT_NEGATIVE[type] ?? false);
  }, [type]);

  const handleSave = () => {
    if (!name.trim()) return;
    addMutation.mutate(
      {
        name: name.trim(),
        type,
        icon,
        color,
        initial_balance: parseInt(initialBalance) || 0,
        allow_negative_balance: allowNegative,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const SelectedIcon = ICONS.find((i) => i.name === icon)?.component;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouveau moyen de paiement</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: BGFIBank" />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Icône</Label>
              <button
                type="button"
                onClick={() => setIconPickerOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background w-full"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                  {SelectedIcon && <SelectedIcon className="h-4 w-4 text-white" />}
                </div>
                <span className="text-sm text-muted-foreground">Changer l'icône</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Couleur</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="space-y-1.5">
              <Label>Solde initial (FCFA)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autoriser le solde négatif</Label>
                <p className="text-xs text-muted-foreground">
                  {allowNegative
                    ? "Le solde pourra devenir négatif (découvert autorisé)"
                    : "Les transactions seront bloquées si le solde est insuffisant"}
                </p>
              </div>
              <Switch checked={allowNegative} onCheckedChange={setAllowNegative} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={!name.trim() || addMutation.isPending}>
                Enregistrer
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <IconPicker open={iconPickerOpen} onOpenChange={setIconPickerOpen} value={icon} onSelect={setIcon} />
    </>
  );
};

export default AddPaymentMethodSheet;

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod,
  TYPE_LABELS, getTypeFromCategory, getCategoryFromType,
} from "@/hooks/use-payment-methods";
import IconPicker, { ICONS } from "./IconPicker";
import ColorPicker from "./ColorPicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: PaymentMethod | null;
}

const EditPaymentMethodSheet = ({ open, onOpenChange, method }: Props) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [icon, setIcon] = useState("Banknote");
  const [color, setColor] = useState("#3B82F6");
  const [initialBalance, setInitialBalance] = useState("");
  const [allowNegative, setAllowNegative] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();

  useEffect(() => {
    if (method && open) {
      setName(method.name);
      setType(getTypeFromCategory(method.category));
      setIcon(method.icon);
      setColor(method.color);
      setInitialBalance(String(method.initial_balance));
      setAllowNegative(method.allow_negative_balance);
    }
  }, [method, open]);

  const handleSave = () => {
    if (!method || !name.trim()) return;
    updateMutation.mutate(
      {
        id: method.id,
        name: name.trim(),
        category: getCategoryFromType(type),
        icon,
        color,
        initial_balance: parseInt(initialBalance) || 0,
        allow_negative_balance: allowNegative,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const handleDelete = () => {
    if (!method) return;
    deleteMutation.mutate(method.id, { onSuccess: () => onOpenChange(false) });
  };

  const SelectedIcon = ICONS.find((i) => i.name === icon)?.component;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Modifier le moyen de paiement</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
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
              <Button className="flex-1" onClick={handleSave} disabled={!name.trim() || updateMutation.isPending}>
                Enregistrer
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">Supprimer</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce moyen de paiement ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Si ce moyen de paiement est lié à des transactions, désactivez-le plutôt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetContent>
      </Sheet>

      <IconPicker open={iconPickerOpen} onOpenChange={setIconPickerOpen} value={icon} onSelect={setIcon} />
    </>
  );
};

export default EditPaymentMethodSheet;

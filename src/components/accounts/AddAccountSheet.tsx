import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddAccount } from "@/hooks/use-accounts";
import { formatXAF, parseAmount } from "@/lib/currency";
import { toast } from "sonner";

const ACCOUNT_TYPES = [
  { value: "Bank" as const, label: "Banque", icon: "🏦" },
  { value: "Mobile Money" as const, label: "Mobile Money", icon: "📱" },
  { value: "Cash" as const, label: "Cash", icon: "💵" },
  { value: "Tontine" as const, label: "Tontine", icon: "🤝" },
];

const ACCOUNT_SUBTYPES = [
  "Visa", "Mastercard", "Carte carburant", "Épargne", "Courant", "Autre"
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddAccountSheet = ({ open, onOpenChange }: Props) => {
  const addAccount = useAddAccount();
  const [name, setName] = useState("");
  const [type, setType] = useState<"Bank" | "Mobile Money" | "Cash" | "Tontine">("Bank");
  const [balanceStr, setBalanceStr] = useState("");

  const reset = () => {
    setName("");
    setType("Bank");
    setBalanceStr("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Veuillez saisir un nom de compte");
      return;
    }
    const icon = ACCOUNT_TYPES.find((t) => t.value === type)?.icon ?? "wallet";
    addAccount.mutate(
      { name: name.trim(), type, balance: parseAmount(balanceStr), icon },
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
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Nouveau compte</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nom du compte</Label>
            <Input
              placeholder="Ex: Orange Money, BICEC..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type de compte</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sous-type (optionnel)</Label>
            <div className="flex gap-1.5 flex-wrap">
              {ACCOUNT_SUBTYPES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setName((prev) => prev ? prev : st)}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  {st}
                </button>
              ))}
            </div>
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

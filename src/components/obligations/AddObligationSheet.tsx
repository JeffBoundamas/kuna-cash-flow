import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddObligation } from "@/hooks/use-obligations";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ObligationType, ObligationConfidence } from "@/lib/obligation-types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: ObligationType;
}

const AddObligationSheet = ({ open, onOpenChange, defaultType = "creance" }: Props) => {
  const [type, setType] = useState<ObligationType>(defaultType);
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [confidence, setConfidence] = useState<ObligationConfidence>("certain");
  const addOb = useAddObligation();

  useEffect(() => {
    if (open) setType(defaultType);
  }, [open, defaultType]);

  const reset = () => {
    setPersonName("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setConfidence("certain");
  };

  const handleSave = async () => {
    const numAmount = parseInt(amount);
    if (!personName.trim() || !numAmount || numAmount <= 0) {
      toast({ title: "Remplissez le nom et le montant", variant: "destructive" });
      return;
    }
    try {
      await addOb.mutateAsync({
        type,
        person_name: personName.trim(),
        total_amount: numAmount,
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        confidence: type === "creance" ? confidence : "certain",
      });
      toast({ title: type === "creance" ? "Créance ajoutée" : "Engagement ajouté" });
      reset();
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const isCreance = type === "creance";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">
            {isCreance ? "Nouvelle créance" : "Nouvel engagement"}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {/* Type toggle */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => setType("creance")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                type === "creance" ? "bg-emerald-600 text-white" : "text-muted-foreground"
              )}
            >
              On me doit
            </button>
            <button
              onClick={() => setType("engagement")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                type === "engagement" ? "bg-destructive text-destructive-foreground" : "text-muted-foreground"
              )}
            >
              Je dois
            </button>
          </div>

          <div>
            <Label>Nom de la personne</Label>
            <Input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Ex: Jean Dupont" />
          </div>

          <div>
            <Label>Montant (FCFA)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label>Description (optionnel)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Motif..." />
          </div>

          <div>
            <Label>Date d'échéance (optionnel)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {type === "creance" && (
            <div>
              <Label>Niveau de certitude</Label>
              <div className="flex gap-2 mt-1.5">
                {([
                  { value: "certain", label: "Certain", color: "bg-emerald-600" },
                  { value: "probable", label: "Probable", color: "bg-amber-500" },
                  { value: "uncertain", label: "Incertain", color: "bg-destructive" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setConfidence(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-medium transition-all border",
                      confidence === opt.value
                        ? `${opt.color} text-white border-transparent`
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full" disabled={addOb.isPending}>
            {addOb.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddObligationSheet;

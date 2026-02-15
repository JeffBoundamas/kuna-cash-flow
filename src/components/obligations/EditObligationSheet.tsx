import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateObligation } from "@/hooks/use-obligations";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Obligation, ObligationConfidence } from "@/lib/obligation-types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  obligation: Obligation;
}

const EditObligationSheet = ({ open, onOpenChange, obligation: ob }: Props) => {
  const [personName, setPersonName] = useState(ob.person_name);
  const [amount, setAmount] = useState(String(ob.total_amount));
  const [description, setDescription] = useState(ob.description || "");
  const [dueDate, setDueDate] = useState(ob.due_date || "");
  const [confidence, setConfidence] = useState<ObligationConfidence>(ob.confidence);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const updateOb = useUpdateObligation();

  useEffect(() => {
    if (open) {
      setPersonName(ob.person_name);
      setAmount(String(ob.total_amount));
      setDescription(ob.description || "");
      setDueDate(ob.due_date || "");
      setConfidence(ob.confidence);
      setErrors({});
      setShowConfirm(false);
    }
  }, [open, ob]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!personName.trim()) {
      newErrors.personName = "Le nom est requis";
    }
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = "Montant invalide";
    } else if (numAmount < ob.total_amount - ob.remaining_amount) {
      newErrors.amount = `Le montant ne peut pas être inférieur aux paiements déjà effectués (${ob.total_amount - ob.remaining_amount} FCFA)`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmClick = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleSave = async () => {
    setShowConfirm(false);
    const numAmount = Number(amount);
    try {
      await updateOb.mutateAsync({
        id: ob.id,
        person_name: personName.trim(),
        total_amount: numAmount,
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        confidence: ob.type === "creance" ? confidence : "certain",
        remaining_amount: ob.remaining_amount,
        original_total: ob.total_amount,
      });
      toast({ title: "Modification enregistrée ✅" });
      onOpenChange(false);
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    }
  };

  const isCreance = ob.type === "creance";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">
              {isCreance ? "Modifier la créance" : "Modifier l'engagement"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nom de la personne</Label>
              <Input
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  if (errors.personName) setErrors(prev => ({ ...prev, personName: "" }));
                }}
                className={cn(errors.personName && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.personName && (
                <p className="text-xs text-destructive mt-1">{errors.personName}</p>
              )}
            </div>

            <div>
              <Label>Montant total (FCFA)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: "" }));
                }}
                className={cn(errors.amount && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label>Date d'échéance (optionnel)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            {isCreance && (
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

            <Button onClick={handleConfirmClick} className="w-full" disabled={updateOb.isPending}>
              {updateOb.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Confirmer la modification</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment modifier {isCreance ? "cette créance" : "cet engagement"} pour <span className="font-semibold text-foreground">{personName.trim()}</span> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditObligationSheet;

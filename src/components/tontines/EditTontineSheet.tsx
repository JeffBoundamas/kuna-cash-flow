import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useUpdateTontine, useDeleteTontine } from "@/hooks/use-tontines";
import { formatXAF, parseAmount } from "@/lib/currency";
import { toast } from "sonner";
import type { Tontine } from "@/lib/tontine-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tontine: Tontine;
  onDeleted: () => void;
}

const EditTontineSheet = ({ open, onOpenChange, tontine, onDeleted }: Props) => {
  const [name, setName] = useState(tontine.name);
  const [amountStr, setAmountStr] = useState(String(tontine.contribution_amount));
  const [frequency, setFrequency] = useState<"weekly" | "monthly">(tontine.frequency);
  const [startDate, setStartDate] = useState(tontine.start_date);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateTontine = useUpdateTontine();
  const deleteTontine = useDeleteTontine();

  useEffect(() => {
    if (open) {
      setName(tontine.name);
      setAmountStr(String(tontine.contribution_amount));
      setFrequency(tontine.frequency);
      setStartDate(tontine.start_date);
      setShowDeleteConfirm(false);
    }
  }, [open, tontine]);

  const amountChanged = parseAmount(amountStr) !== tontine.contribution_amount;
  const frequencyChanged = frequency !== tontine.frequency;
  const showWarning = amountChanged || frequencyChanged;

  const handleSave = () => {
    const amount = parseAmount(amountStr);
    if (!name.trim() || amount <= 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    updateTontine.mutate(
      { id: tontine.id, name: name.trim(), contribution_amount: amount, frequency, start_date: startDate },
      {
        onSuccess: () => {
          toast.success("Tontine mise à jour");
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur lors de la mise à jour"),
      }
    );
  };

  const handleDelete = () => {
    deleteTontine.mutate(tontine.id, {
      onSuccess: () => {
        toast.success("Tontine supprimée");
        onOpenChange(false);
        onDeleted();
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifier la tontine</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nom de la tontine</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cotisation (FCFA)</Label>
              <Input type="number" inputMode="numeric" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date de début</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          {showWarning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Attention : modifier ces paramètres affectera les prochains cycles uniquement.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={updateTontine.isPending}>
              Enregistrer
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-destructive hover:underline w-full text-center"
              >
                Supprimer cette tontine
              </button>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-destructive">
                  Cette action supprimera la tontine et toutes les données associées. Continuer ?
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                    Non
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete} disabled={deleteTontine.isPending}>
                    Oui, supprimer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditTontineSheet;

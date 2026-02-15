import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateAccount, useDeleteAccount } from "@/hooks/use-accounts";
import { toast } from "sonner";
import type { Account } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onDeleted?: () => void;
}

const EditAccountSheet = ({ open, onOpenChange, account, onDeleted }: Props) => {
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setThreshold(account.balance_threshold != null ? String(account.balance_threshold) : "");
      setConfirmDelete(false);
    }
  }, [account]);

  const handleSave = () => {
    if (!account || !name.trim()) return;
    const thresholdVal = threshold.trim() ? Number(threshold) : null;
    updateAccount.mutate(
      { id: account.id, name: name.trim(), balance_threshold: thresholdVal },
      {
        onSuccess: () => {
          toast.success("Compte mis à jour");
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur"),
      }
    );
  };

  const handleDelete = () => {
    if (!account) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteAccount.mutate(account.id, {
      onSuccess: () => {
        toast.success("Compte supprimé");
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Modifier le compte</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nom du compte</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Seuil d'alerte (FCFA)</Label>
            <Input
              type="number"
              placeholder="Ex: 50000"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Vous serez alerté quand le solde passe sous ce montant. Laissez vide pour désactiver.
            </p>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={updateAccount.isPending}>
            Enregistrer
          </Button>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={deleteAccount.isPending}
          >
            {confirmDelete ? "Confirmer la suppression" : "Supprimer le compte"}
          </Button>
          {confirmDelete && (
            <p className="text-xs text-destructive text-center">
              Cette action est irréversible. Toutes les transactions liées seront conservées.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditAccountSheet;

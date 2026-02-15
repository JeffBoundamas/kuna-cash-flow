import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ResetDataSheet = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleReset = async () => {
    if (!user || confirmText !== "SUPPRIMER") return;
    setDeleting(true);

    try {
      // Delete in order: contributions, transactions, recurring, budgets, goals, categories, accounts
      await supabase.from("goal_contributions").delete().eq("user_id", user.id);
      await supabase.from("transactions").delete().eq("user_id", user.id);
      await supabase.from("recurring_transactions").delete().eq("user_id", user.id);
      await supabase.from("budgets").delete().eq("user_id", user.id);
      await supabase.from("goals").delete().eq("user_id", user.id);
      await supabase.from("categories").delete().eq("user_id", user.id);
      await supabase.from("accounts").delete().eq("user_id", user.id);

      // Invalidate all queries
      qc.invalidateQueries();

      toast({ title: "Toutes vos données ont été supprimées" });
      onOpenChange(false);
      setStep(1);
      setConfirmText("");
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStep(1); setConfirmText(""); } }}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Réinitialiser mes données
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {step === 1 && (
            <>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Action irréversible</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cela supprimera définitivement toutes vos données : comptes, transactions, 
                      budgets, objectifs, catégories et transactions récurrentes.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setStep(2)}
              >
                Je comprends, continuer
              </Button>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Tapez <strong className="text-destructive">SUPPRIMER</strong> pour confirmer
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="text-center font-mono"
              />
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleReset}
                disabled={confirmText !== "SUPPRIMER" || deleting}
              >
                {deleting ? "Suppression en cours..." : "Supprimer toutes mes données"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setStep(1); setConfirmText(""); }}>
                Retour
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ResetDataSheet;

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useLogContribution } from "@/hooks/use-tontines";
import { useCreateNotification } from "@/hooks/use-notifications";
import { formatXAF } from "@/lib/currency";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tontineId: string;
  tontineName: string;
  amount: number;
  currentCycle: number;
  totalMembers?: number;
}

const LogContributionSheet = ({ open, onOpenChange, tontineId, tontineName, amount, currentCycle, totalMembers }: Props) => {
  const { data: accounts = [] } = useAccounts();
  const [accountId, setAccountId] = useState("");
  const logContribution = useLogContribution();
  const createNotification = useCreateNotification();

  const handleSubmit = () => {
    if (!accountId) {
      toast.error("Choisissez un compte");
      return;
    }
    logContribution.mutate(
      {
        tontine_id: tontineId,
        amount,
        cycle_number: currentCycle,
        linked_account_id: accountId,
        tontine_name: tontineName,
      },
      {
        onSuccess: () => {
          const toastMsg = `Cotisation de ${formatXAF(amount)} enregistrée pour ${tontineName} — Tour ${currentCycle}/${totalMembers ?? "?"}`;
          toast.success(toastMsg);
          createNotification.mutate({
            type: "cotisation_logged",
            title: "Cotisation enregistrée",
            body: toastMsg,
            related_tontine_id: tontineId,
          });
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur"),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Enregistrer ma cotisation</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Montant de la cotisation</p>
            <p className="text-xl font-bold font-display">{formatXAF(amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cycle {currentCycle} • {tontineName}</p>
          </div>

          <div className="space-y-2">
            <Label>Depuis quel compte ?</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({formatXAF(a.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={logContribution.isPending}>
            Enregistrer la cotisation
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LogContributionSheet;

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useReceivePot } from "@/hooks/use-tontines";
import { useCreateNotification } from "@/hooks/use-notifications";
import { formatXAF } from "@/lib/currency";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tontineId: string;
  tontineName: string;
  potAmount: number;
  currentCycle: number;
  memberId: string;
  onPotReceived?: () => void;
}

const ReceivePotSheet = ({ open, onOpenChange, tontineId, tontineName, potAmount, currentCycle, memberId, onPotReceived }: Props) => {
  const { data: accounts = [] } = useAccounts();
  const [accountId, setAccountId] = useState("");
  const receivePot = useReceivePot();
  const createNotification = useCreateNotification();

  const handleSubmit = () => {
    if (!accountId) {
      toast.error("Choisissez un compte");
      return;
    }
    receivePot.mutate(
      {
        tontine_id: tontineId,
        amount: potAmount,
        cycle_number: currentCycle,
        linked_account_id: accountId,
        tontine_name: tontineName,
        member_id: memberId,
      },
      {
        onSuccess: () => {
          const msg = `Félicitations ! Vous avez reçu le pot de ${formatXAF(potAmount)} !`;
          toast.success(`🎉 ${msg}`);
          createNotification.mutate({
            type: "pot_received",
            title: "Pot reçu !",
            body: msg,
            related_tontine_id: tontineId,
          });
          onOpenChange(false);
          onPotReceived?.();
        },
        onError: () => toast.error("Erreur"),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>🎉 J'ai reçu le pot !</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl bg-gold-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Montant du pot</p>
            <p className="text-2xl font-bold font-display text-gold">{formatXAF(potAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{tontineName}</p>
          </div>

          <div className="space-y-2">
            <Label>Sur quel compte l'avez-vous reçu ?</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground" onClick={handleSubmit} disabled={receivePot.isPending}>
            Confirmer la réception
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReceivePotSheet;

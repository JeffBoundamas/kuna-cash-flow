import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useAddFundsToGoal } from "@/hooks/use-goals";
import { formatXAF } from "@/lib/currency";
import { toast } from "sonner";
import type { Goal } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: Goal | null;
  onGoalReached?: () => void;
}

const AddFundsSheet = ({ open, onOpenChange, goal, onGoalReached }: Props) => {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const { data: accounts = [] } = useAccounts();
  const addFunds = useAddFundsToGoal();

  const handleSubmit = () => {
    const parsedAmount = parseInt(amount.replace(/\s/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0 || !accountId || !goal) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    addFunds.mutate(
      { goalId: goal.id, amount: parsedAmount, accountId },
      {
        onSuccess: () => {
          toast.success(`${formatXAF(parsedAmount)} ajoutés à "${goal.name}"`);
          const newTotal = goal.current_amount + parsedAmount;
          if (newTotal >= goal.target_amount && onGoalReached) {
            onGoalReached();
          }
          setAmount("");
          setAccountId("");
          onOpenChange(false);
        },
        onError: (err: Error) => toast.error(err.message || "Erreur"),
      }
    );
  };

  const remaining = goal ? goal.target_amount - goal.current_amount : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle className="font-display">Ajouter des fonds</SheetTitle>
        </SheetHeader>
        {goal && (
          <div className="space-y-4 mt-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{goal.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Reste à épargner : <span className="font-bold text-foreground">{formatXAF(Math.max(0, remaining))}</span>
              </p>
            </div>

            <div>
              <Label>Montant (XAF)</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 25 000"
              />
            </div>

            <div>
              <Label>Depuis le compte</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} — {formatXAF(acc.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={addFunds.isPending}>
              {addFunds.isPending ? "En cours..." : "Ajouter les fonds"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AddFundsSheet;

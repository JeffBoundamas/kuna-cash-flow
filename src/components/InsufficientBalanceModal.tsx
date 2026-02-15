import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { formatXAF } from "@/lib/currency";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  currentBalance: number;
  requestedAmount: number;
  onChooseAnother?: () => void;
}

const InsufficientBalanceModal = ({
  open,
  onOpenChange,
  accountName,
  currentBalance,
  requestedAmount,
  onChooseAnother,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <DialogTitle className="font-display text-lg">Solde insuffisant</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Le solde de <strong className="text-foreground">{accountName}</strong> est de{" "}
          <strong className="text-foreground">{formatXAF(currentBalance)}</strong>.
          <br />
          Cette opération de{" "}
          <strong className="text-foreground">{formatXAF(requestedAmount)}</strong> ne peut pas être
          effectuée.
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-col mt-2">
          {onChooseAnother && (
            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                onChooseAnother();
              }}
            >
              Choisir un autre compte
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InsufficientBalanceModal;

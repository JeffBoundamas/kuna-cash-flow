import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUpdateFixedCharge, useDeleteFixedCharge } from "@/hooks/use-fixed-charges";
import { useCategories } from "@/hooks/use-categories";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { FixedCharge, FixedChargeFrequency } from "@/lib/fixed-charge-types";

interface Props {
  charge: FixedCharge | null;
  onClose: () => void;
}

const EditFixedChargeSheet = ({ charge, onClose }: Props) => {
  const [name, setName] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<FixedChargeFrequency>("monthly");
  const [dueDay, setDueDay] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [pmId, setPmId] = useState("");
  const [autoObligation, setAutoObligation] = useState(true);
  const [reminderDays, setReminderDays] = useState("3");
  const [endDate, setEndDate] = useState("");

  const updateCharge = useUpdateFixedCharge();
  const deleteCharge = useDeleteFixedCharge();
  const { data: categories = [] } = useCategories();
  const { data: methods = [] } = usePaymentMethods();

  useEffect(() => {
    if (charge) {
      setName(charge.name);
      setBeneficiary(charge.beneficiary);
      setAmount(String(charge.amount));
      setFrequency(charge.frequency);
      setDueDay(String(charge.due_day));
      setCategoryId(charge.category_id || "");
      setPmId(charge.payment_method_id || "");
      setAutoObligation(charge.auto_generate_obligation);
      setReminderDays(String(charge.reminder_days_before));
      setEndDate(charge.end_date || "");
    }
  }, [charge]);

  const handleSubmit = () => {
    if (!charge) return;
    const amt = parseInt(amount.replace(/\s/g, ""), 10);
    const day = parseInt(dueDay, 10);
    if (!name.trim() || !amt || !day || day < 1 || day > 31) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    updateCharge.mutate({
      id: charge.id,
      name: name.trim(),
      amount: amt,
      frequency,
      due_day: day,
      category_id: categoryId || null,
      payment_method_id: pmId || null,
      beneficiary: beneficiary.trim(),
      auto_generate_obligation: autoObligation,
      reminder_days_before: parseInt(reminderDays, 10) || 3,
      end_date: endDate || null,
    }, {
      onSuccess: () => { toast.success("Charge modifiée !"); onClose(); },
      onError: () => toast.error("Erreur"),
    });
  };

  const handleDelete = () => {
    if (!charge) return;
    deleteCharge.mutate(charge.id, {
      onSuccess: () => { toast.success("Charge supprimée"); onClose(); },
      onError: () => toast.error("Erreur"),
    });
  };

  const expenseCategories = categories.filter(c => c.type === "Expense");

  return (
    <Sheet open={!!charge} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Modifier la charge fixe</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nom *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label>Bénéficiaire</Label>
            <Input value={beneficiary} onChange={e => setBeneficiary(e.target.value)} />
          </div>
          <div>
            <Label>Montant (FCFA) *</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {expenseCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fréquence</Label>
              <Select value={frequency} onValueChange={v => setFrequency(v as FixedChargeFrequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jour d'échéance *</Label>
              <Input type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Moyen de paiement préféré</Label>
            <Select value={pmId} onValueChange={setPmId}>
              <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
              <SelectContent>
                {methods.filter(m => m.is_active).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Générer les engagements</p>
              <p className="text-[11px] text-muted-foreground">Impact sur la trésorerie prévisionnelle</p>
            </div>
            <Switch checked={autoObligation} onCheckedChange={setAutoObligation} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rappel (jours avant)</Label>
              <Input type="number" min={0} max={30} value={reminderDays} onChange={e => setReminderDays(e.target.value)} />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={updateCharge.isPending}>
            {updateCharge.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive gap-1.5">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette charge ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Les engagements déjà créés ne seront pas supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditFixedChargeSheet;

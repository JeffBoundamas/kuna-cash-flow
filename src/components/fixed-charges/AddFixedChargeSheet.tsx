import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddFixedCharge } from "@/hooks/use-fixed-charges";
import { useCategories } from "@/hooks/use-categories";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { toast } from "sonner";
import type { FixedChargeFrequency } from "@/lib/fixed-charge-types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const AddFixedChargeSheet = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<FixedChargeFrequency>("monthly");
  const [dueDay, setDueDay] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [pmId, setPmId] = useState("");
  const [autoObligation, setAutoObligation] = useState(true);
  const [reminderDays, setReminderDays] = useState("3");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");

  const addCharge = useAddFixedCharge();
  const { data: categories = [] } = useCategories();
  const { data: methods = [] } = usePaymentMethods();

  const expenseCategories = categories.filter(c => c.type === "Expense");

  const reset = () => {
    setName(""); setBeneficiary(""); setAmount(""); setFrequency("monthly");
    setDueDay("1"); setCategoryId(""); setPmId(""); setAutoObligation(true);
    setReminderDays("3"); setStartDate(new Date().toISOString().slice(0, 10)); setEndDate("");
  };

  const handleSubmit = () => {
    const amt = parseInt(amount.replace(/\s/g, ""), 10);
    const day = parseInt(dueDay, 10);
    if (!name.trim() || !amt || !day || day < 1 || day > 31) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    addCharge.mutate({
      name: name.trim(),
      amount: amt,
      frequency,
      due_day: day,
      category_id: categoryId || undefined,
      payment_method_id: pmId || undefined,
      beneficiary: beneficiary.trim(),
      auto_generate_obligation: autoObligation,
      reminder_days_before: parseInt(reminderDays, 10) || 3,
      start_date: startDate,
      end_date: endDate || undefined,
    }, {
      onSuccess: () => {
        toast.success("Charge fixe créée !");
        reset();
        onOpenChange(false);
      },
      onError: () => toast.error("Erreur lors de la création"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Nouvelle charge fixe</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nom *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Loyer, Internet, SEEG" />
          </div>
          <div>
            <Label>Bénéficiaire</Label>
            <Input value={beneficiary} onChange={e => setBeneficiary(e.target.value)} placeholder="Ex: Agence N1" />
          </div>
          <div>
            <Label>Montant (FCFA) *</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50 000" />
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
              <p className="text-[10px] text-muted-foreground mt-0.5">Pour les mois courts, dernier jour du mois</p>
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
              <p className="text-[11px] text-muted-foreground">Crée automatiquement un engagement à chaque échéance pour impacter votre trésorerie</p>
            </div>
            <Switch checked={autoObligation} onCheckedChange={setAutoObligation} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rappel (jours avant)</Label>
              <Input type="number" min={0} max={30} value={reminderDays} onChange={e => setReminderDays(e.target.value)} />
            </div>
            <div>
              <Label>Date de début</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Date de fin (optionnel)</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={addCharge.isPending}>
            {addCharge.isPending ? "Création..." : "Créer la charge fixe"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddFixedChargeSheet;

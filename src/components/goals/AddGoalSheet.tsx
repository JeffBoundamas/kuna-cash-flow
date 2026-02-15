import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAddGoal } from "@/hooks/use-goals";
import { toast } from "sonner";
import { Shield, MapPin, GraduationCap, Target, Heart, Home, Car, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = [
  { key: "target", Icon: Target },
  { key: "shield", Icon: Shield },
  { key: "map-pin", Icon: MapPin },
  { key: "graduation-cap", Icon: GraduationCap },
  { key: "heart", Icon: Heart },
  { key: "home", Icon: Home },
  { key: "car", Icon: Car },
  { key: "plane", Icon: Plane },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const AddGoalSheet = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("target");
  const [isEmergency, setIsEmergency] = useState(false);
  const addGoal = useAddGoal();

  const reset = () => {
    setName("");
    setTargetAmount("");
    setDeadline("");
    setIcon("target");
    setIsEmergency(false);
  };

  const handleSubmit = () => {
    const amount = parseInt(targetAmount.replace(/\s/g, ""), 10);
    if (!name.trim() || !amount || !deadline) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    addGoal.mutate(
      { name: name.trim(), target_amount: amount, deadline, icon, is_emergency_fund: isEmergency },
      {
        onSuccess: () => {
          toast.success("Objectif créé !");
          reset();
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur lors de la création"),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle className="font-display">Nouvel Objectif</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Voyage au Cameroun" maxLength={60} />
          </div>
          <div>
            <Label>Montant cible (XAF)</Label>
            <Input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="500 000" />
          </div>
          <div>
            <Label>Échéance</Label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          {/* Icon picker */}
          <div>
            <Label>Icône</Label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {ICONS.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center border transition-all",
                    icon === key
                      ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground border-border hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Fonds d'urgence</p>
              <p className="text-xs text-muted-foreground">Marquer comme prioritaire</p>
            </div>
            <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={addGoal.isPending}>
            {addGoal.isPending ? "Création..." : "Créer l'objectif"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddGoalSheet;

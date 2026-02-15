import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod } from "@/hooks/use-payment-methods";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AccountType } from "@/lib/types";

const CATEGORIES: { value: AccountType; label: string; emoji: string }[] = [
  { value: "Bank", label: "Banque", emoji: "🏦" },
  { value: "Mobile Money", label: "Mobile Money", emoji: "📱" },
  { value: "Cash", label: "Cash", emoji: "💵" },
  { value: "Tontine", label: "Tontine", emoji: "🤝" },
];

const EMOJIS = ["💳", "🏦", "📱", "💵", "🤝", "⛽", "🛒", "✈️", "🏠", "🚗", "💰", "🎓"];

const PaymentMethodSettings = () => {
  const navigate = useNavigate();
  const { data: methods = [] } = usePaymentMethods();
  const addMethod = useAddPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💳");
  const [category, setCategory] = useState<AccountType>("Bank");

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Veuillez saisir un nom");
      return;
    }
    addMethod.mutate(
      { name: name.trim(), icon, category },
      {
        onSuccess: () => {
          toast.success("Moyen de paiement ajouté");
          setName("");
          setIcon("💳");
          setShowForm(false);
        },
        onError: () => toast.error("Erreur lors de l'ajout"),
      }
    );
  };

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    methods: methods.filter((m) => m.category === cat.value),
  }));

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold font-display">Moyens de paiement</h1>
      </div>

      <p className="text-xs text-muted-foreground">
        Configurez les types de moyens de paiement disponibles lors de la création d'un compte.
      </p>

      {/* Grouped list */}
      {grouped.map((group) => (
        <div key={group.value} className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <span>{group.emoji}</span> {group.label}
          </h2>
          {group.methods.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">Aucun moyen de paiement</p>
          ) : (
            <div className="space-y-1">
              {group.methods.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-sm font-medium">{m.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer "${m.name}" ?`)) {
                        deleteMethod.mutate(m.id, {
                          onSuccess: () => toast.success("Supprimé"),
                        });
                      }
                    }}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add form */}
      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
          <h3 className="text-sm font-semibold">Nouveau moyen de paiement</h3>
          <div>
            <Label className="text-xs">Nom</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carte Visa, Airtel Money..."
              maxLength={40}
            />
          </div>
          <div>
            <Label className="text-xs">Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AccountType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Icône</Label>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center border text-lg transition-all",
                    icon === e
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={addMethod.isPending} className="flex-1">
              {addMethod.isPending ? "Ajout..." : "Ajouter"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-1.5" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Ajouter un moyen de paiement
        </Button>
      )}
    </div>
  );
};

export default PaymentMethodSettings;

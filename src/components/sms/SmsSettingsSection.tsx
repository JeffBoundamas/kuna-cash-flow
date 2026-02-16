import { useState, useEffect } from "react";
import { MessageSquare, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useSmsSettings, useUpsertSmsSettings } from "@/hooks/use-sms-imports";
import { useActivePaymentMethods } from "@/hooks/use-payment-methods";
import { useCategories } from "@/hooks/use-categories";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SmsSettingsSection = () => {
  const { data: settings, isLoading } = useSmsSettings();
  const { data: paymentMethods = [] } = useActivePaymentMethods();
  const { data: categories = [] } = useCategories();
  const upsertSettings = useUpsertSmsSettings();

  const [enabled, setEnabled] = useState(true);
  const [defaultPm, setDefaultPm] = useState("");
  const [mappings, setMappings] = useState<{ keyword: string; category: string }[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setDefaultPm(settings.default_payment_method_id || "");
      setMappings(settings.category_mappings || []);
    }
  }, [settings]);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sms-import`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié !" });
  };

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    await upsertSettings.mutateAsync({ enabled: val });
  };

  const handlePmChange = async (val: string) => {
    setDefaultPm(val);
    await upsertSettings.mutateAsync({ default_payment_method_id: val });
  };

  const addMapping = async () => {
    if (!newKeyword.trim() || !newCategory) return;
    const updated = [...mappings, { keyword: newKeyword.trim(), category: newCategory }];
    setMappings(updated);
    setNewKeyword("");
    setNewCategory("");
    await upsertSettings.mutateAsync({ category_mappings: updated as any });
  };

  const removeMapping = async (idx: number) => {
    const updated = mappings.filter((_, i) => i !== idx);
    setMappings(updated);
    await upsertSettings.mutateAsync({ category_mappings: updated as any });
  };

  if (isLoading) return null;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-bold font-display flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Intégration SMS
        </h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Activer l'import SMS</span>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>

        {enabled && (
          <>
            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Clé API webhook</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={settings?.api_key || "Générer..."}
                  className="text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(settings?.api_key || "")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">URL du webhook</label>
              <div className="flex gap-2">
                <Input readOnly value={webhookUrl} className="text-xs font-mono" />
                <Button size="sm" variant="outline" onClick={() => handleCopy(webhookUrl)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Utilisez cette URL et cette clé dans votre raccourci iOS ou votre scénario Make.com pour envoyer les SMS automatiquement.
              </p>
            </div>

            {/* Default payment method */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Moyen de paiement par défaut pour les SMS
              </label>
              <Select value={defaultPm} onValueChange={handlePmChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category mappings */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Catégories automatiques</label>
              {mappings.length > 0 && (
                <div className="space-y-1">
                  {mappings.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg px-3 py-2">
                      <span className="font-mono flex-1">{m.keyword}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="flex-1">{m.category}</span>
                      <button onClick={() => removeMapping(idx)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Mot-clé"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  className="text-xs flex-1"
                />
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="text-xs flex-1">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={addMapping} disabled={!newKeyword.trim() || !newCategory}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmsSettingsSection;

import { ArrowLeft, Bell, Coins, AlertTriangle, PartyPopper, HandCoins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferences, useUpdateNotificationPreference, type NotificationPreferences } from "@/hooks/use-notification-preferences";
import { Skeleton } from "@/components/ui/skeleton";

const items: { key: keyof NotificationPreferences; icon: React.ElementType; label: string; desc: string }[] = [
  { key: "cotisation_reminder", icon: Coins, label: "Rappels de cotisation", desc: "3 jours avant l'échéance d'une cotisation tontine" },
  { key: "cotisation_late", icon: AlertTriangle, label: "Cotisations en retard", desc: "Alerte si une cotisation n'a pas été versée à temps" },
  { key: "pot_upcoming", icon: PartyPopper, label: "Réception de pot", desc: "7 jours avant la réception de votre pot tontine" },
  { key: "obligation_reminder", icon: HandCoins, label: "Rappels d'obligations", desc: "3 jours avant l'échéance d'un engagement ou créance" },
  { key: "obligation_late", icon: AlertTriangle, label: "Obligations en retard", desc: "Alerte si une obligation est en retard de paiement" },
];

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const { mutate: update } = useUpdateNotificationPreference();

  const toggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    update({ [key]: !prefs[key] });
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold font-display">Notifications</h1>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold font-display">Types de notifications</h2>
        </div>
        <div className="divide-y divide-border">
          {items.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Icon className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-11 rounded-full shrink-0" />
              ) : (
                <Switch
                  checked={prefs?.[key] ?? true}
                  onCheckedChange={() => toggle(key)}
                  className="shrink-0"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

import { useState, useEffect } from "react";
import { X, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DISMISSED_KEY = "kuna_push_dismissed";

const PushNotificationBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if not supported
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    // Already granted or denied
    if (Notification.permission !== "default") return;

    // Don't show if dismissed recently (7 days)
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 86400000) return;

    // Delay showing to avoid overwhelming on first load
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleActivate = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notifications activées !");
        // Register for push if service worker is ready
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          // Service worker is ready for push
          console.log("Push notification permission granted, SW ready");
        }
      } else {
        toast.info("Vous pouvez activer les notifications plus tard dans les paramètres");
      }
    } catch {
      toast.error("Impossible d'activer les notifications");
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  if (!visible) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 mx-auto max-w-lg animate-in slide-in-from-top-4 duration-300">
      <div className="rounded-2xl bg-card border border-accent/30 p-4 shadow-lg flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold font-display">Ne manquez rien</p>
          <p className="text-xs text-muted-foreground">
            Activez les notifications pour ne jamais manquer une cotisation
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleActivate}
          className="rounded-xl flex-shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Activer
        </Button>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PushNotificationBanner;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCheck, Trash2, Bell, Coins, AlertTriangle, PartyPopper, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const typeIcons: Record<string, typeof Bell> = {
  cotisation_reminder: Coins,
  cotisation_late: AlertTriangle,
  pot_upcoming: PartyPopper,
  cotisation_logged: Coins,
  pot_received: PartyPopper,
  obligation_reminder: HandCoins,
  obligation_late: AlertTriangle,
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const handleTap = (n: (typeof notifications)[0]) => {
    if (!n.is_read) markAsRead.mutate(n.id);
    if (n.related_tontine_id) {
      navigate(`/tontines/${n.related_tontine_id}`);
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold font-display">Notifications</h1>
        </div>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            className="text-xs text-muted-foreground"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucune notification</p>
        </div>
      ) : (
        <AnimatePresence>
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            const isGold = n.type === "pot_upcoming" || n.type === "pot_received";
            const isLate = n.type === "cotisation_late";

            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`relative rounded-xl border p-4 cursor-pointer transition-colors ${
                  !n.is_read
                    ? "bg-accent/5 border-accent/20"
                    : "bg-card border-border"
                }`}
                onClick={() => handleTap(n)}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      isGold
                        ? "bg-gold/15 text-gold"
                        : isLate
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification.mutate(n.id);
                        }}
                        className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};

export default NotificationsPage;

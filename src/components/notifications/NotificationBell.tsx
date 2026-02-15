import { Bell } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const unreadCount = useUnreadCount();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/notifications")}
      className="relative p-2 rounded-full hover:bg-muted transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;

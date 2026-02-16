import { ReactNode, useState, useRef, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "./BottomNav";
import QuickAddModal from "@/components/transactions/QuickAddModal";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import PushNotificationBanner from "@/components/pwa/PushNotificationBanner";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const PULL_THRESHOLD = 80;

const AppLayout = ({ children }: AppLayoutProps) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const location = useLocation();
  useAppBootstrap();
  useOfflineQueue();

  const queryClient = useQueryClient();

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0 && !isRefreshing) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.4, 120));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.5);
      await queryClient.invalidateQueries();
      await new Promise(r => setTimeout(r, 600));
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, queryClient]);

  // Hide global FAB on portfolio page (Créances tab has its own FAB)
  const hideGlobalFab = location.pathname === "/portfolio";

  return (
    <div className="min-h-screen bg-background">
      {/* Top notification bar */}
      <div className="sticky top-0 z-30 flex justify-end px-4 py-2 bg-background/80 backdrop-blur-sm mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl">
        <NotificationBell />
      </div>

      <main
        ref={scrollRef}
        className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl pb-24 overflow-y-auto overflow-x-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: pullDistance > 0 || isRefreshing ? `${Math.max(pullDistance, isRefreshing ? 40 : 0)}px` : "0px" }}
        >
          <RefreshCw
            className={cn(
              "h-5 w-5 text-primary transition-transform",
              isRefreshing && "animate-spin",
              pullDistance >= PULL_THRESHOLD && !isRefreshing && "text-primary"
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
            }}
          />
        </div>

        {children}
      </main>

      {/* Global FAB */}
      {!hideGlobalFab && (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
          aria-label="Ajout rapide"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <QuickAddModal open={showQuickAdd} onOpenChange={setShowQuickAdd} />
      <InstallPrompt />
      <PushNotificationBanner />
      <BottomNav />
    </div>
  );
};

export default AppLayout;

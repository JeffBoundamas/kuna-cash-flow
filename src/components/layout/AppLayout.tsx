import { ReactNode, useState } from "react";
import { Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import QuickAddModal from "@/components/transactions/QuickAddModal";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const location = useLocation();
  useAppBootstrap();
  useOfflineQueue();

  // Hide global FAB on portfolio page (Créances tab has its own FAB)
  const hideGlobalFab = location.pathname === "/portfolio";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg pb-24">{children}</main>

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
      <BottomNav />
    </div>
  );
};

export default AppLayout;

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail, ChevronRight, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <h1 className="text-xl font-bold font-display">Profil</h1>

      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold font-display truncate">
              {user?.user_metadata?.full_name || "Utilisateur"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        <button
          onClick={() => navigate("/categories?type=expense")}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ArrowDownCircle className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="text-sm font-medium">Catégories de dépenses</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate("/categories?type=income")}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="text-sm font-medium">Catégories de revenus</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full rounded-xl py-5 text-sm font-semibold"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Se déconnecter
      </Button>
    </div>
  );
};

export default Settings;

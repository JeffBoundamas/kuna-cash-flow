import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="px-4 pt-6 space-y-5">
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

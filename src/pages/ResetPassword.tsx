import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import kunaLogo from "@/assets/logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Succès ✓", description: "Votre mot de passe a été réinitialisé." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <img src={kunaLogo} alt="Kuna" className="h-16 w-16 mb-4" />
        <p className="text-muted-foreground text-sm text-center">
          Vérification du lien de réinitialisation…
        </p>
        <div className="mt-4 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src={kunaLogo} alt="Kuna" className="h-20 w-20 drop-shadow-md" />
        <h1 className="text-2xl font-bold font-display">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">Choisissez un nouveau mot de passe sécurisé</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full rounded-xl py-6 text-base font-semibold" size="lg">
          {submitting ? "Chargement..." : "Réinitialiser le mot de passe"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;

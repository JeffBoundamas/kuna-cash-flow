import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import kunaLogo from "@/assets/logo.png";

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Compte créé ✓",
          description: "Vérifiez votre email pour confirmer votre inscription.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src={kunaLogo} alt="Kuna" className="h-20 w-20 drop-shadow-md" />
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display">Kuna Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos finances avec confiance
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="w-full max-w-sm">
        <div className="flex rounded-xl bg-muted p-1 gap-1 mb-6">
          <button
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
              mode === "login"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("register")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
              mode === "register"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl py-6 text-base font-semibold"
            size="lg"
          >
            {submitting
              ? "Chargement..."
              : mode === "login"
              ? "Se connecter"
              : "Créer un compte"}
          </Button>

          {mode === "login" && (
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  toast({ title: "Email requis", description: "Entrez votre email pour réinitialiser le mot de passe.", variant: "destructive" });
                  return;
                }
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) throw error;
                  toast({ title: "Email envoyé ✓", description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe." });
                } catch (err: any) {
                  toast({ title: "Erreur", description: err.message, variant: "destructive" });
                }
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mot de passe oublié ?
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;

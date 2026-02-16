import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail, Phone, ChevronRight, ArrowDownCircle, ArrowUpCircle, Repeat, Download, Upload, FileText, Trash2, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { toast } from "@/hooks/use-toast";
import { formatXAF } from "@/lib/currency";
import ExportCSVSheet from "@/components/data/ExportCSVSheet";
import ExportPDFSheet from "@/components/data/ExportPDFSheet";
import ImportCSVSheet from "@/components/data/ImportCSVSheet";
import ResetDataSheet from "@/components/data/ResetDataSheet";
import SmsSettingsSection from "@/components/sms/SmsSettingsSection";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [showExportCSV, setShowExportCSV] = useState(false);
  const [showExportPDF, setShowExportPDF] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const { data: recurrings = [] } = useRecurringTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const catMap = new Map(categories.map(c => [c.id, c]));
  const accMap = new Map(accounts.map(a => [a.id, a]));

  // Load phone from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.phone) setPhone(data.phone);
      });
  }, [user]);

  const savePhone = async () => {
    if (!user) return;
    setSavingPhone(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("user_id", user.id);
    setSavingPhone(false);
    if (error) {
      toast({ title: "Erreur", variant: "destructive" });
    } else {
      toast({ title: "Numéro enregistré ✓" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const toggleRecurring = async (id: string, isActive: boolean) => {
    await supabase
      .from("recurring_transactions")
      .update({ is_active: !isActive })
      .eq("id", id);
    toast({ title: isActive ? "Récurrence désactivée" : "Récurrence activée" });
  };

  const freqLabel = (f: string) => {
    if (f === "daily") return "Quotidien";
    if (f === "weekly") return "Hebdo";
    return "Mensuel";
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

        {/* Phone number */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Numéro WhatsApp (pour rappels futurs)
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              onClick={savePhone}
              disabled={savingPhone}
              size="sm"
              variant="outline"
              className="rounded-xl"
            >
              {savingPhone ? "..." : "OK"}
            </Button>
          </div>
        </div>
      </div>

      {/* Recurring transactions */}
      {recurrings.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-bold font-display flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              Transactions récurrentes
            </h2>
          </div>
          <div className="divide-y divide-border">
            {recurrings.map((rt) => {
              const cat = catMap.get(rt.category_id);
              const acc = accMap.get(rt.account_id);
              return (
                <div key={rt.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{rt.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {cat?.name} · {acc?.name} · {freqLabel(rt.frequency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold font-display">
                      {formatXAF(rt.amount)}
                    </span>
                    <button
                      onClick={() => toggleRecurring(rt.id, rt.is_active)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        rt.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {rt.is_active ? "Actif" : "Inactif"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        <button
          onClick={() => navigate("/notification-settings")}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="text-sm font-medium">Paramètres de notifications</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Categories */}
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

      {/* Data management */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-bold font-display">Gestion des données</h2>
        </div>
        <button
          onClick={() => setShowExportCSV(true)}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Exporter en CSV</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => setShowExportPDF(true)}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Résumé mensuel PDF</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => setShowImportCSV(true)}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Importer un CSV</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => setShowReset(true)}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Réinitialiser mes données</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* SMS Integration */}
      <SmsSettingsSection />

      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full rounded-xl py-5 text-sm font-semibold"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Se déconnecter
      </Button>

      <ExportCSVSheet open={showExportCSV} onOpenChange={setShowExportCSV} />
      <ExportPDFSheet open={showExportPDF} onOpenChange={setShowExportPDF} />
      <ImportCSVSheet open={showImportCSV} onOpenChange={setShowImportCSV} />
      <ResetDataSheet open={showReset} onOpenChange={setShowReset} />
    </div>
  );
};

export default Settings;

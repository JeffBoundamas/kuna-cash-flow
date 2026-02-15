import { useState, useRef, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ColumnMapping = {
  date: string;
  label: string;
  amount: string;
  category: string;
};

const REQUIRED_FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "label", label: "Libellé" },
  { key: "amount", label: "Montant" },
  { key: "category", label: "Catégorie" },
];

const ImportCSVSheet = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const fileRef = useRef<HTMLInputElement>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: "", label: "", amount: "", category: "" });
  const [accountId, setAccountId] = useState("");
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");

  const catMap = useMemo(() => new Map(categories.map((c) => [c.name.toLowerCase(), c.id])), [categories]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: "Fichier vide ou invalide", variant: "destructive" });
        return;
      }

      const parsedHeaders = lines[0].split(/[,;]/).map((h) => h.replace(/"/g, "").trim());
      const parsedRows = lines.slice(1).map((l) => l.split(/[,;]/).map((c) => c.replace(/"/g, "").trim()));

      setHeaders(parsedHeaders);
      setRows(parsedRows);

      // Auto-map common names
      const autoMap: ColumnMapping = { date: "", label: "", amount: "", category: "" };
      for (const h of parsedHeaders) {
        const lower = h.toLowerCase();
        if (lower.includes("date")) autoMap.date = h;
        else if (lower.includes("libel") || lower.includes("label") || lower.includes("description")) autoMap.label = h;
        else if (lower.includes("montant") || lower.includes("amount")) autoMap.amount = h;
        else if (lower.includes("categ") || lower.includes("category")) autoMap.category = h;
      }
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user || !accountId) return;
    if (!mapping.date || !mapping.label || !mapping.amount) {
      toast({ title: "Mappez au moins Date, Libellé et Montant", variant: "destructive" });
      return;
    }

    setImporting(true);
    const dateIdx = headers.indexOf(mapping.date);
    const labelIdx = headers.indexOf(mapping.label);
    const amountIdx = headers.indexOf(mapping.amount);
    const catIdx = mapping.category ? headers.indexOf(mapping.category) : -1;

    const defaultCatId = categories.find((c) => c.name === "Divers")?.id ?? categories[0]?.id;
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const dateVal = row[dateIdx];
      const labelVal = row[labelIdx];
      const amountVal = parseFloat(row[amountIdx]?.replace(/\s/g, "").replace(",", "."));

      if (!dateVal || !labelVal || isNaN(amountVal)) {
        skipped++;
        continue;
      }

      // Parse date (try ISO and DD/MM/YYYY)
      let parsedDate = dateVal;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)) {
        const [d, m, y] = dateVal.split("/");
        parsedDate = `${y}-${m}-${d}`;
      }

      const catName = catIdx >= 0 ? row[catIdx]?.toLowerCase() : "";
      const categoryId = catMap.get(catName) ?? defaultCatId;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: accountId,
        category_id: categoryId,
        amount: Math.round(amountVal),
        label: labelVal,
        date: parsedDate,
      });

      if (error) skipped++;
      else imported++;
    }

    // Update account balance
    if (imported > 0) {
      const { data: acc } = await supabase.from("accounts").select("balance").eq("id", accountId).maybeSingle();
      if (acc) {
        const totalAmount = rows.reduce((sum, row) => {
          const val = parseFloat(row[amountIdx]?.replace(/\s/g, "").replace(",", "."));
          return isNaN(val) ? sum : sum + Math.round(val);
        }, 0);
        await supabase.from("accounts").update({ balance: acc.balance + totalAmount }).eq("id", accountId);
      }
    }

    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["transactions-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });

    toast({ title: `${imported} transaction${imported > 1 ? "s" : ""} importée${imported > 1 ? "s" : ""}${skipped > 0 ? `, ${skipped} ignorée${skipped > 1 ? "s" : ""}` : ""}` });
    setImporting(false);
    setStep("done");
    setTimeout(() => {
      onOpenChange(false);
      setStep("upload");
      setHeaders([]);
      setRows([]);
    }, 1500);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStep("upload"); setHeaders([]); setRows([]); } }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importer un CSV
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {step === "upload" && (
            <>
              <p className="text-sm text-muted-foreground">
                Sélectionnez un fichier CSV contenant vos transactions.
              </p>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              <Button className="w-full" variant="outline" onClick={() => fileRef.current?.click()}>
                Choisir un fichier CSV
              </Button>
            </>
          )}

          {step === "map" && (
            <>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Aperçu</p>
                <p className="text-sm">{rows.length} lignes · {headers.length} colonnes</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  Colonnes : {headers.join(", ")}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Compte destination</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {REQUIRED_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label} {field.key !== "category" && <span className="text-destructive">*</span>}</Label>
                    <Select
                      value={mapping[field.key]}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [field.key]: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder={`Colonne pour ${field.label}`} /></SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {!mapping.category && (
                <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    Sans colonne catégorie, toutes les transactions seront classées dans "Divers".
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={handleImport} disabled={importing || !accountId}>
                {importing ? "Import en cours..." : `Importer ${rows.length} transactions`}
              </Button>
            </>
          )}

          {step === "done" && (
            <p className="text-sm text-center text-primary font-medium py-4">
              ✓ Import terminé !
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ImportCSVSheet;

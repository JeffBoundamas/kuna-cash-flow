import { useState, useMemo } from "react";
import { MessageSquare, ChevronLeft, AlertTriangle, Check, X, Loader2, SendHorizontal, Download, Wifi, Store, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/currency";
import { parseSms, parseBulkSms, getSmsTypeLabel, type ParsedSms } from "@/lib/sms-parser";
import { useCategories } from "@/hooks/use-categories";
import { useActivePaymentMethods } from "@/hooks/use-payment-methods";
import { useAddTransaction } from "@/hooks/use-transactions";
import { useCreateSmsImport, useUpdateSmsImport, useCheckDuplicateTid, useSmsImports, useSmsSettings } from "@/hooks/use-sms-imports";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PreviewItem {
  parsed: ParsedSms;
  rawText: string;
  isDuplicate: boolean;
  selectedCategory: string;
  selectedPaymentMethodId: string;
  status: "pending" | "confirming" | "confirmed" | "rejected";
}

const typeIcons: Record<string, React.ElementType> = {
  transfer_out: SendHorizontal,
  transfer_in: Download,
  bundle: Wifi,
  merchant_payment: Store,
  bill_payment: Receipt,
};

const SmsImport = () => {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [parsing, setParsing] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: paymentMethods = [] } = useActivePaymentMethods();
  const { data: imports = [] } = useSmsImports();
  const { data: smsSettings } = useSmsSettings();
  const addTransaction = useAddTransaction();
  const createSmsImport = useCreateSmsImport();
  const updateSmsImport = useUpdateSmsImport();
  const checkDuplicate = useCheckDuplicateTid();

  const expenseCategories = useMemo(() => categories.filter(c => c.type === "Expense"), [categories]);
  const incomeCategories = useMemo(() => categories.filter(c => c.type === "Income"), [categories]);

  const defaultPaymentMethodId = smsSettings?.default_payment_method_id || paymentMethods[0]?.id || "";

  const findCategoryId = (suggestedName: string, isIncome: boolean): string => {
    // Check custom mappings first
    if (smsSettings?.category_mappings) {
      for (const m of smsSettings.category_mappings) {
        if (suggestedName.toLowerCase().includes(m.keyword.toLowerCase())) {
          const cat = categories.find(c => c.name === m.category);
          if (cat) return cat.id;
        }
      }
    }
    const pool = isIncome ? incomeCategories : expenseCategories;
    // Exact match in type-specific pool
    const found = pool.find(c => c.name.toLowerCase() === suggestedName.toLowerCase());
    if (found) return found.id;
    // Search across all categories (e.g. "Mobile Money" may not exist but partial match helps)
    const anyMatch = categories.find(c => c.name.toLowerCase() === suggestedName.toLowerCase());
    if (anyMatch) return anyMatch.id;
    // Partial match: try to find a category containing the suggested name or vice versa
    const partialMatch = pool.find(c =>
      c.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
      suggestedName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (partialMatch) return partialMatch.id;
    // Final fallback: "Divers" then first available
    const fallback = pool.find(c => c.name === "Divers") || pool[0];
    return fallback?.id || "";
  };

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);

    const results = parseBulkSms(rawText);
    if (results.length === 0) {
      // Try single parse
      const single = parseSms(rawText.trim());
      if (single) {
        results.push({ parsed: single, rawText: rawText.trim() });
      }
    }

    if (results.length === 0) {
      toast({ title: "Aucun SMS reconnu", description: "Vérifiez le format du SMS.", variant: "destructive" });
      setParsing(false);
      return;
    }

    const items: PreviewItem[] = [];
    for (const r of results) {
      const isDuplicate = await checkDuplicate(r.parsed.tid);
      const isIncome = r.parsed.type === "transfer_in";
      items.push({
        parsed: r.parsed,
        rawText: r.rawText,
        isDuplicate,
        selectedCategory: findCategoryId(r.parsed.suggestedCategory, isIncome),
        selectedPaymentMethodId: defaultPaymentMethodId,
        status: isDuplicate ? "rejected" : "pending",
      });
    }

    setPreviews(items);
    setParsing(false);
  };

  const handleConfirm = async (index: number) => {
    const item = previews[index];
    if (!item || item.isDuplicate) return;

    setPreviews(prev => prev.map((p, i) => i === index ? { ...p, status: "confirming" as const } : p));

    try {
      const isIncome = item.parsed.type === "transfer_in";
      const amount = isIncome ? item.parsed.amount : -item.parsed.amount;

      // Create transaction
      await addTransaction.mutateAsync({
        account_id: item.selectedPaymentMethodId,
        category_id: item.selectedCategory,
        amount,
        label: item.parsed.label,
        sms_reference: item.parsed.tid,
        payment_method_id: item.selectedPaymentMethodId,
        date: new Date().toISOString().slice(0, 10),
      });

      // Create sms_import record
      await createSmsImport.mutateAsync({
        raw_text: item.rawText,
        transaction_id: item.parsed.tid,
        parsed_type: item.parsed.type,
        parsed_amount: item.parsed.amount,
        parsed_fees: item.parsed.fees,
        parsed_balance: item.parsed.balance,
        parsed_recipient: item.parsed.recipient,
        parsed_reference: item.parsed.reference,
        status: "confirmed",
      });

      setPreviews(prev => prev.map((p, i) => i === index ? { ...p, status: "confirmed" as const } : p));
      toast({ title: "Transaction importée ✓" });
    } catch (err: any) {
      // Check for duplicate constraint violation
      if (err?.message?.includes("duplicate") || err?.code === "23505") {
        setPreviews(prev => prev.map((p, i) => i === index ? { ...p, isDuplicate: true, status: "rejected" as const } : p));
        toast({ title: "Déjà importé", variant: "destructive" });
      } else {
        setPreviews(prev => prev.map((p, i) => i === index ? { ...p, status: "pending" as const } : p));
        toast({ title: "Erreur", description: err?.message, variant: "destructive" });
      }
    }
  };

  const handleReject = async (index: number) => {
    const item = previews[index];
    if (!item) return;

    try {
      await createSmsImport.mutateAsync({
        raw_text: item.rawText,
        transaction_id: item.parsed.tid,
        parsed_type: item.parsed.type,
        parsed_amount: item.parsed.amount,
        parsed_fees: item.parsed.fees,
        parsed_balance: item.parsed.balance,
        parsed_recipient: item.parsed.recipient,
        parsed_reference: item.parsed.reference,
        status: "rejected",
      });
    } catch {}

    setPreviews(prev => prev.map((p, i) => i === index ? { ...p, status: "rejected" as const } : p));
  };

  const handleConfirmAll = async () => {
    for (let i = 0; i < previews.length; i++) {
      if (previews[i].status === "pending" && !previews[i].isDuplicate) {
        await handleConfirm(i);
      }
    }
  };

  const pendingCount = previews.filter(p => p.status === "pending" && !p.isDuplicate).length;

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Confirmé</Badge>;
      case "rejected": return <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">Rejeté</Badge>;
      case "duplicate": return <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">Déjà importé</Badge>;
      case "pending_review": return <Badge className="bg-accent text-accent-foreground border-0 text-[10px]">En attente</Badge>;
      default: return null;
    }
  };

  return (
    <div className="px-4 lg:px-6 pt-6 pb-24 lg:pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display">Importer SMS</h1>
          <p className="text-xs text-muted-foreground">Airtel Money Gabon</p>
        </div>
      </div>

      {/* Paste area */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Collez le contenu du SMS ici
        </label>
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="Vous avez envoye 10300F au 077123456 Jean Dupont.Frais 200F. Nouveau Solde 45000F.TID:ABC123456."
          rows={5}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-[10px] text-muted-foreground">
          Vous pouvez coller plusieurs SMS séparés par une ligne vide.
        </p>
        <Button
          onClick={handleParse}
          disabled={parsing || !rawText.trim()}
          className="w-full rounded-xl"
        >
          {parsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
          Parser
        </Button>
      </div>

      {/* Preview cards */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display">
              {previews.length} SMS détecté{previews.length > 1 ? "s" : ""}
            </h2>
            {pendingCount > 1 && (
              <Button size="sm" onClick={handleConfirmAll} className="rounded-xl text-xs">
                <Check className="h-3 w-3 mr-1" />
                Tout confirmer ({pendingCount})
              </Button>
            )}
          </div>

          {previews.map((item, idx) => {
            const TypeIcon = typeIcons[item.parsed.type] || MessageSquare;
            const isIncome = item.parsed.type === "transfer_in";
            const allCats = isIncome ? incomeCategories : expenseCategories;

            return (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl border p-4 space-y-3 transition-all",
                  item.isDuplicate ? "border-destructive/30 bg-destructive/5" : "border-border bg-card",
                  item.status === "confirmed" && "border-primary/30 bg-primary/5 opacity-80",
                  item.status === "rejected" && "opacity-50"
                )}
              >
                {/* Type + amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      isIncome ? "bg-primary/10" : "bg-muted"
                    )}>
                      <TypeIcon className={cn("h-4 w-4", isIncome ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <span className="text-xs font-medium">{getSmsTypeLabel(item.parsed.type)}</span>
                      {item.isDuplicate && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-[10px] font-medium">Déjà importé</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={cn(
                    "text-lg font-bold font-display",
                    isIncome ? "text-primary" : "text-foreground"
                  )}>
                    {isIncome ? "+" : "-"}{formatXAF(item.parsed.amount)}
                  </p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {item.parsed.fees > 0 && (
                    <div>
                      <span className="text-muted-foreground">Frais:</span>{" "}
                      <span className="font-medium">{formatXAF(item.parsed.fees)}</span>
                    </div>
                  )}
                  {item.parsed.recipient && (
                    <div>
                      <span className="text-muted-foreground">
                        {isIncome ? "De:" : "À:"}
                      </span>{" "}
                      <span className="font-medium truncate">{item.parsed.recipient}</span>
                    </div>
                  )}
                  {item.parsed.balance != null && (
                    <div>
                      <span className="text-muted-foreground">Solde:</span>{" "}
                      <span className="font-medium">{formatXAF(Math.round(item.parsed.balance))}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">TID:</span>{" "}
                    <span className="font-mono text-[10px]">{item.parsed.tid}</span>
                  </div>
                </div>

                {/* Editable fields */}
                {item.status === "pending" && !item.isDuplicate && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Catégorie</label>
                      <Select
                        value={item.selectedCategory}
                        onValueChange={(val) => {
                          setPreviews(prev => prev.map((p, i) =>
                            i === idx ? { ...p, selectedCategory: val } : p
                          ));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allCats.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Moyen de paiement</label>
                      <Select
                        value={item.selectedPaymentMethodId}
                        onValueChange={(val) => {
                          setPreviews(prev => prev.map((p, i) =>
                            i === idx ? { ...p, selectedPaymentMethodId: val } : p
                          ));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(pm => (
                            <SelectItem key={pm.id} value={pm.id}>
                              {pm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {item.status === "pending" && !item.isDuplicate && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConfirm(idx)}
                      size="sm"
                      className="flex-1 rounded-xl text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Confirmer
                    </Button>
                    <Button
                      onClick={() => handleReject(idx)}
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                )}

                {item.status === "confirming" && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}

                {item.status === "confirmed" && (
                  <div className="flex items-center justify-center gap-1 text-primary text-xs font-medium">
                    <Check className="h-4 w-4" />
                    Importé avec succès
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Import history */}
      {imports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display">Historique des imports</h2>
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
            {imports.slice(0, 20).map(imp => {
              const TypeIcon = typeIcons[imp.parsed_type] || MessageSquare;
              const isIncome = imp.parsed_type === "transfer_in";
              return (
                <div key={imp.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                    isIncome ? "bg-primary/10" : "bg-muted"
                  )}>
                    <TypeIcon className={cn("h-4 w-4", isIncome ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {getSmsTypeLabel(imp.parsed_type as any)} · TID:{imp.transaction_id}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(imp.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className={cn(
                    "text-xs font-bold font-display",
                    isIncome ? "text-primary" : "text-foreground"
                  )}>
                    {isIncome ? "+" : "-"}{formatXAF(imp.parsed_amount)}
                  </p>
                  {statusBadge(imp.status)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsImport;

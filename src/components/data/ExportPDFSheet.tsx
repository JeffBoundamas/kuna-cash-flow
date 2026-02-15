import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useAllTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { formatXAF } from "@/lib/currency";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportPDFSheet = ({ open, onOpenChange }: Props) => {
  const { data: transactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));

  const now = new Date();
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const summary = useMemo(() => {
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    let income = 0;
    let expenses = 0;
    const byCat: Record<string, number> = {};

    for (const tx of monthTxs) {
      if (tx.amount > 0) income += tx.amount;
      else {
        expenses += Math.abs(tx.amount);
        const cat = catMap.get(tx.category_id) ?? "Autre";
        byCat[cat] = (byCat[cat] ?? 0) + Math.abs(tx.amount);
      }
    }

    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    return { income, expenses, net: income - expenses, sortedCats, count: monthTxs.length };
  }, [transactions, catMap]);

  const handleExport = () => {
    // Generate printable HTML and open in new window for PDF saving
    const catRows = summary.sortedCats
      .map(
        ([cat, amt]) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${cat}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${formatXAF(amt)}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>kuna.${now.toISOString().slice(0, 10).replace(/-/g, "")}.resume-mensuel</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 40px auto; color: #1a1a1a; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .summary-card { background: #f8f8f8; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-card .label { font-size: 11px; color: #888; }
    .summary-card .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
    .income { color: #16a34a; }
    .expense { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; background: #f1f1f1; font-size: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Résumé financier</h1>
  <p class="subtitle">${monthName} · ${summary.count} transactions</p>
  <div class="summary-grid">
    <div class="summary-card"><div class="label">Revenus</div><div class="value income">${formatXAF(summary.income)}</div></div>
    <div class="summary-card"><div class="label">Dépenses</div><div class="value expense">${formatXAF(summary.expenses)}</div></div>
    <div class="summary-card"><div class="label">Solde net</div><div class="value" style="color:${summary.net >= 0 ? '#16a34a' : '#dc2626'}">${summary.net >= 0 ? '+' : ''}${formatXAF(summary.net)}</div></div>
  </div>
  <h2 style="font-size:14px;margin-bottom:8px;">Dépenses par catégorie</h2>
  <table><thead><tr><th>Catégorie</th><th style="text-align:right">Montant</th></tr></thead><tbody>${catRows}</tbody></table>
  <p style="margin-top:24px;font-size:11px;color:#999;text-align:center;">Généré par Kuna Finance · ${new Date().toLocaleDateString("fr-FR")}</p>
  <script>window.print();</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Résumé mensuel PDF
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground text-center">
            Résumé de <strong>{monthName}</strong>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted p-3 text-center">
              <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Revenus</p>
              <p className="text-sm font-bold font-display text-primary">{formatXAF(summary.income)}</p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <TrendingDown className="h-4 w-4 text-destructive mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Dépenses</p>
              <p className="text-sm font-bold font-display text-destructive">{formatXAF(summary.expenses)}</p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <p className="text-[10px] text-muted-foreground mt-1">Solde net</p>
              <p className={`text-sm font-bold font-display ${summary.net >= 0 ? "text-primary" : "text-destructive"}`}>
                {summary.net >= 0 ? "+" : ""}{formatXAF(summary.net)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {summary.count} transactions · {summary.sortedCats.length} catégories
          </p>
          <Button className="w-full" onClick={handleExport}>
            Ouvrir / Imprimer en PDF
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExportPDFSheet;

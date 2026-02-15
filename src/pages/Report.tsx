import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  Printer,
} from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { useAllTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { usePaymentMethodsWithBalance } from "@/hooks/use-payment-methods-with-balance";
import { useObligations } from "@/hooks/use-obligations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const CHART_COLORS = [
  "hsl(160, 84%, 30%)", "hsl(43, 74%, 49%)", "hsl(210, 100%, 52%)",
  "hsl(0, 84%, 60%)", "hsl(280, 60%, 50%)", "hsl(30, 90%, 55%)",
  "hsl(180, 60%, 40%)", "hsl(330, 70%, 50%)", "hsl(120, 50%, 40%)",
  "hsl(60, 70%, 45%)",
];

const Report = () => {
  const navigate = useNavigate();
  const { data: transactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: paymentMethods = [] } = usePaymentMethodsWithBalance();
  const { data: obligations = [] } = useObligations();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [year, setYear] = useState(now.getFullYear());

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const pmMap = useMemo(() => new Map(paymentMethods.map((p) => [p.id, p])), [paymentMethods]);

  const monthLabel = `${MONTHS_FR[month]} ${year}`;
  const generatedAt = now.toLocaleDateString("fr-FR") + " à " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  // Filter transactions for selected month
  const monthTxs = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return transactions.filter((t) => t.date.startsWith(prefix));
  }, [transactions, month, year]);

  const sorted = useMemo(
    () => [...monthTxs].sort((a, b) => a.date.localeCompare(b.date)),
    [monthTxs]
  );

  const incomeTxs = sorted.filter((t) => t.amount > 0);
  const expenseTxs = sorted.filter((t) => t.amount < 0);

  // Stats
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const byCat: Record<string, number> = {};
    const byPM: Record<string, number> = {};

    monthTxs.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else {
        const absAmt = Math.abs(t.amount);
        expenses += absAmt;
        const catName = catMap.get(t.category_id)?.name ?? "Autre";
        byCat[catName] = (byCat[catName] ?? 0) + absAmt;
        const pmId = t.payment_method_id || t.account_id;
        const pmName = pmMap.get(pmId)?.name ?? "Inconnu";
        byPM[pmName] = (byPM[pmName] ?? 0) + absAmt;
      }
    });

    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const sortedPMs = Object.entries(byPM).sort((a, b) => b[1] - a[1]);

    return { income, expenses, net: income - expenses, count: monthTxs.length, sortedCats, sortedPMs };
  }, [monthTxs, catMap, pmMap]);

  // Obligations - active
  const activeObligations = useMemo(
    () => obligations.filter((o) => o.status === "active" || o.status === "partially_paid"),
    [obligations]
  );
  const activeCreances = activeObligations.filter((o) => o.type === "creance");
  const activeEngagements = activeObligations.filter((o) => o.type === "engagement");
  const totalCreances = activeCreances.reduce((s, o) => s + o.remaining_amount, 0);
  const totalEngagements = activeEngagements.reduce((s, o) => s + o.remaining_amount, 0);

  // Treasury forecast
  const totalBalance = paymentMethods.reduce((s, pm) => s + pm.currentBalance, 0);
  const soldePrevisionnel = totalBalance + totalCreances - totalEngagements;

  // Chart data
  const barData = [
    { name: "Entrées", value: stats.income, fill: "hsl(160, 84%, 30%)" },
    { name: "Dépenses", value: stats.expenses, fill: "hsl(0, 84%, 60%)" },
  ];

  const pieDataCat = stats.sortedCats.map(([name, value], i) => ({
    name,
    value,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const pieDataPM = stats.sortedPMs.map(([name, value], i) => ({
    name,
    value,
    fill: CHART_COLORS[(i + 3) % CHART_COLORS.length],
  }));

  // Priority for obligations
  const getPriority = (dueDate: string | null) => {
    if (!dueDate) return { label: "Normal", color: "text-muted-foreground" };
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (due.getTime() - today.getTime()) / 86400000;
    if (diff < 0) return { label: "En retard", color: "text-destructive" };
    if (diff < 7) return { label: "Urgent", color: "text-warning" };
    return { label: "Normal", color: "text-muted-foreground" };
  };

  const getStatut = (dueDate: string | null) => {
    if (!dueDate) return { label: "À venir", color: "text-primary" };
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return { label: "En retard", color: "text-destructive" };
    return { label: "À venir", color: "text-primary" };
  };

  // PDF Export
  const handleExportPDF = () => {
    const catRows = stats.sortedCats.map(([cat, amt]) => {
      const pct = stats.expenses > 0 ? ((amt / stats.expenses) * 100).toFixed(1) : "0";
      return `<tr><td>${cat}</td><td class="r">${formatXAF(amt)}</td><td class="r">${pct}%</td></tr>`;
    }).join("");

    const incomeRows = incomeTxs.map((t, i) =>
      `<tr class="${i % 2 ? 'alt' : ''}"><td>ENT-${year}-${String(i + 1).padStart(3, "0")}</td><td>${new Date(t.date).toLocaleDateString("fr-FR")}</td><td>${catMap.get(t.category_id)?.name ?? "-"}</td><td>${t.label}</td><td class="r">${formatXAF(t.amount)}</td></tr>`
    ).join("");

    const expenseRows = expenseTxs.map((t, i) =>
      `<tr class="${i % 2 ? 'alt' : ''}"><td>DEP-${year}-${String(i + 1).padStart(3, "0")}</td><td>${new Date(t.date).toLocaleDateString("fr-FR")}</td><td>${catMap.get(t.category_id)?.name ?? "-"}</td><td>${t.label}</td><td class="r">${formatXAF(Math.abs(t.amount))}</td></tr>`
    ).join("");

    const engRows = activeEngagements.map((o) => {
      const p = getPriority(o.due_date);
      return `<tr><td>${o.person_name}</td><td>${o.description || "-"}</td><td class="r">${formatXAF(o.remaining_amount)}</td><td>${o.due_date ? new Date(o.due_date).toLocaleDateString("fr-FR") : "-"}</td><td style="color:${p.label === "En retard" ? "#dc2626" : p.label === "Urgent" ? "#f59e0b" : "#666"}">${p.label}</td></tr>`;
    }).join("");

    const creRows = activeCreances.map((o) => {
      const s = getStatut(o.due_date);
      return `<tr><td>${o.person_name}</td><td>${o.description || "-"}</td><td class="r">${formatXAF(o.remaining_amount)}</td><td>${o.due_date ? new Date(o.due_date).toLocaleDateString("fr-FR") : "-"}</td><td style="color:${s.label === "En retard" ? "#dc2626" : "#16a34a"}">${s.label}</td></tr>`;
    }).join("");

    const totalPages = 2 + (activeEngagements.length + activeCreances.length > 0 ? 1 : 0);

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Rapport Financier - ${monthLabel}</title>
<style>
@page { size: A4; margin: 20mm; }
body { font-family: -apple-system,BlinkMacSystemFont,sans-serif; color:#1a1a1a; font-size:12px; max-width:700px; margin:0 auto; }
h1 { font-size:20px; color:#059669; margin:0 0 2px; }
h2 { font-size:14px; margin:20px 0 8px; padding-bottom:4px; border-bottom:2px solid #059669; color:#059669; }
.meta { color:#888; font-size:11px; margin-bottom:20px; }
table { width:100%; border-collapse:collapse; margin-bottom:16px; }
th { text-align:left; padding:8px; background:#f0fdf4; font-size:11px; font-weight:600; border-bottom:2px solid #d1d5db; }
td { padding:6px 8px; border-bottom:1px solid #e5e7eb; font-size:11px; }
tr.alt td { background:#f9fafb; }
.r { text-align:right; }
.summary-table td:first-child { font-weight:500; }
.summary-table td:last-child { font-weight:700; text-align:right; }
.green { color:#16a34a; } .red { color:#dc2626; }
.page-break { page-break-before:always; }
.footer { text-align:center; font-size:10px; color:#999; margin-top:30px; padding-top:10px; border-top:1px solid #eee; }
@media print { body { margin:0; } .no-print { display:none; } }
</style>
</head><body>
<h1>Rapport Financier — ${monthLabel}</h1>
<p class="meta">Généré le ${generatedAt}</p>

<h2>Résumé Exécutif</h2>
<table class="summary-table"><tbody>
<tr><td>Total des Entrées</td><td class="green">${formatXAF(stats.income)}</td></tr>
<tr><td>Total des Dépenses</td><td class="red">${formatXAF(stats.expenses)}</td></tr>
<tr><td>Solde Net du mois</td><td style="color:${stats.net >= 0 ? '#16a34a' : '#dc2626'}">${stats.net >= 0 ? "+" : ""}${formatXAF(stats.net)}</td></tr>
<tr><td>Nombre de Transactions</td><td>${stats.count}</td></tr>
</tbody></table>

<h2>Prévision de Trésorerie</h2>
<table class="summary-table"><tbody>
<tr><td>Solde actuel (fin de mois)</td><td>${formatXAF(totalBalance)}</td></tr>
<tr><td>+ Créances à recevoir</td><td class="green">+${formatXAF(totalCreances)}</td></tr>
<tr><td>- Engagements à payer</td><td class="red">-${formatXAF(totalEngagements)}</td></tr>
<tr style="border-top:2px solid #059669"><td><strong>= Solde prévisionnel</strong></td><td style="font-size:13px;color:${soldePrevisionnel >= 0 ? '#16a34a' : '#dc2626'}"><strong>${soldePrevisionnel >= 0 ? "+" : ""}${formatXAF(soldePrevisionnel)}</strong></td></tr>
</tbody></table>

<div class="page-break"></div>

${incomeTxs.length > 0 ? `<h2>Entrées</h2>
<table><thead><tr><th>Code</th><th>Date</th><th>Source</th><th>Description</th><th class="r">Montant</th></tr></thead><tbody>${incomeRows}</tbody></table>` : ""}

${expenseTxs.length > 0 ? `<h2>Dépenses</h2>
<table><thead><tr><th>Code</th><th>Date</th><th>Catégorie</th><th>Bénéficiaire</th><th class="r">Montant</th></tr></thead><tbody>${expenseRows}</tbody></table>` : ""}

${stats.sortedCats.length > 0 || activeEngagements.length > 0 || activeCreances.length > 0 ? '<div class="page-break"></div>' : ""}

${stats.sortedCats.length > 0 ? `<h2>Répartition des Dépenses par Catégorie</h2>
<table><thead><tr><th>Catégorie</th><th class="r">Montant (FCFA)</th><th class="r">% du Total</th></tr></thead><tbody>${catRows}</tbody></table>` : ""}

${activeEngagements.length > 0 ? `<h2>Engagements en Cours (à payer)</h2>
<table><thead><tr><th>Bénéficiaire</th><th>Référence</th><th class="r">Montant</th><th>Échéance</th><th>Priorité</th></tr></thead><tbody>${engRows}</tbody></table>` : ""}

${activeCreances.length > 0 ? `<h2>Créances en Cours (à recevoir)</h2>
<table><thead><tr><th>Client</th><th>Facture</th><th class="r">Montant</th><th>Échéance</th><th>Statut</th></tr></thead><tbody>${creRows}</tbody></table>` : ""}

<div class="footer">Généré par Kuna Finance · ${now.toLocaleDateString("fr-FR")}</div>
<script>window.print();</script>
</body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // CSV Exports
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTransactionsCSV = () => {
    const header = "Code,Date,Type,Catégorie,Bénéficiaire/Source,Description,Montant,Moyen de paiement\n";
    let incIdx = 0, expIdx = 0;
    const rows = sorted.map((t) => {
      const isIncome = t.amount > 0;
      const code = isIncome
        ? `ENT-${year}-${String(++incIdx).padStart(3, "0")}`
        : `DEP-${year}-${String(++expIdx).padStart(3, "0")}`;
      const type = isIncome ? "Entrée" : "Dépense";
      const cat = catMap.get(t.category_id)?.name ?? "";
      const pmId = t.payment_method_id || t.account_id;
      const pm = pmMap.get(pmId)?.name ?? "";
      return [code, t.date, type, `"${cat}"`, `"${t.label}"`, `"${t.label}"`, Math.abs(t.amount), `"${pm}"`].join(",");
    }).join("\n");
    downloadCSV(`rapport-transactions-${year}-${String(month + 1).padStart(2, "0")}.csv`, header + rows);
  };

  const handleExportCreancesCSV = () => {
    const header = "Client,Description,Montant Total,Montant Restant,Échéance,Confiance,Statut\n";
    const rows = activeCreances.map((o) =>
      [`"${o.person_name}"`, `"${o.description || ""}"`, o.total_amount, o.remaining_amount, o.due_date || "", o.confidence, o.status].join(",")
    ).join("\n");
    downloadCSV(`rapport-creances-${year}-${String(month + 1).padStart(2, "0")}.csv`, header + rows);
  };

  const handleExportEngagementsCSV = () => {
    const header = "Bénéficiaire,Description,Montant Total,Montant Restant,Échéance,Priorité,Statut\n";
    const rows = activeEngagements.map((o) => {
      const p = getPriority(o.due_date);
      return [`"${o.person_name}"`, `"${o.description || ""}"`, o.total_amount, o.remaining_amount, o.due_date || "", p.label, o.status].join(",");
    }).join("\n");
    downloadCSV(`rapport-engagements-${year}-${String(month + 1).padStart(2, "0")}.csv`, header + rows);
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.04) return null;
    return (
      <text x={x} y={y} fill="hsl(217, 33%, 17%)" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={10}>
        {name} {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <div className="px-4 pt-6 space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/transactions")} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Retour">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold font-display flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Rapport
          </h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1.5">
              <MoreVertical className="h-3.5 w-3.5" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF} className="gap-2 text-xs">
              <Printer className="h-3.5 w-3.5" /> Exporter en PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportTransactionsCSV} className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Transactions (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCreancesCSV} className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Créances (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportEngagementsCSV} className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Engagements (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => goMonth(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <span className="text-sm font-bold font-display min-w-[160px] text-center">{monthLabel}</span>
        <button onClick={() => goMonth(1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Généré le {generatedAt}</p>

      {/* Executive Summary */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold font-display text-primary">Résumé Exécutif</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Indicateur</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2">Total des Entrées</td>
                <td className="py-2 px-2 text-right font-bold text-primary">{formatXAF(stats.income)}</td>
              </tr>
              <tr className="border-b border-border/50 bg-muted/30">
                <td className="py-2 px-2">Total des Dépenses</td>
                <td className="py-2 px-2 text-right font-bold text-destructive">{formatXAF(stats.expenses)}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2">Solde Net du mois</td>
                <td className={cn("py-2 px-2 text-right font-bold", stats.net >= 0 ? "text-primary" : "text-destructive")}>
                  {stats.net >= 0 ? "+" : ""}{formatXAF(stats.net)}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2">Nombre de Transactions</td>
                <td className="py-2 px-2 text-right font-bold">{stats.count}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Treasury Forecast */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold font-display text-primary">Prévision de Trésorerie</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Élément</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2">Solde actuel (fin de mois)</td>
                <td className="py-2 px-2 text-right font-bold">{formatXAF(totalBalance)}</td>
              </tr>
              <tr className="border-b border-border/50 bg-muted/30">
                <td className="py-2 px-2">+ Créances à recevoir</td>
                <td className="py-2 px-2 text-right font-bold text-primary">+{formatXAF(totalCreances)}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2">- Engagements à payer</td>
                <td className="py-2 px-2 text-right font-bold text-destructive">-{formatXAF(totalEngagements)}</td>
              </tr>
              <tr className="bg-primary/5">
                <td className="py-2.5 px-2 font-bold">= Solde prévisionnel</td>
                <td className={cn("py-2.5 px-2 text-right font-bold text-sm", soldePrevisionnel >= 0 ? "text-primary" : "text-destructive")}>
                  {soldePrevisionnel >= 0 ? "+" : ""}{formatXAF(soldePrevisionnel)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      {stats.count > 0 && (
        <div className="space-y-4">
          {/* Income vs Expenses bar chart */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-bold font-display">Entrées vs Dépenses</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatXAF(value)} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expenses by category donut */}
          {pieDataCat.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-bold font-display">Dépenses par Catégorie</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieDataCat}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    label={CustomPieLabel}
                    labelLine={false}
                  >
                    {pieDataCat.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatXAF(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expenses by payment method donut */}
          {pieDataPM.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-bold font-display">Moyens de Paiement</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieDataPM}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    label={CustomPieLabel}
                    labelLine={false}
                  >
                    {pieDataPM.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatXAF(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Income transactions */}
      {incomeTxs.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-primary/5">
            <h2 className="text-sm font-bold font-display text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Entrées ({incomeTxs.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Source</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Montant</th>
                </tr>
              </thead>
              <tbody>
                {incomeTxs.map((t, i) => (
                  <tr key={t.id} className={cn("border-b border-border/50", i % 2 && "bg-muted/20")}>
                    <td className="py-2 px-3 font-mono text-muted-foreground">ENT-{year}-{String(i + 1).padStart(3, "0")}</td>
                    <td className="py-2 px-3">{new Date(t.date).toLocaleDateString("fr-FR")}</td>
                    <td className="py-2 px-3">{catMap.get(t.category_id)?.name ?? "-"}</td>
                    <td className="py-2 px-3">{t.label}</td>
                    <td className="py-2 px-3 text-right font-bold text-primary">{formatXAF(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense transactions */}
      {expenseTxs.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-destructive/5">
            <h2 className="text-sm font-bold font-display text-destructive flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Dépenses ({expenseTxs.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Catégorie</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Bénéficiaire</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Montant</th>
                </tr>
              </thead>
              <tbody>
                {expenseTxs.map((t, i) => (
                  <tr key={t.id} className={cn("border-b border-border/50", i % 2 && "bg-muted/20")}>
                    <td className="py-2 px-3 font-mono text-muted-foreground">DEP-{year}-{String(i + 1).padStart(3, "0")}</td>
                    <td className="py-2 px-3">{new Date(t.date).toLocaleDateString("fr-FR")}</td>
                    <td className="py-2 px-3">{catMap.get(t.category_id)?.name ?? "-"}</td>
                    <td className="py-2 px-3">{t.label}</td>
                    <td className="py-2 px-3 text-right font-bold text-destructive">{formatXAF(Math.abs(t.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category breakdown table */}
      {stats.sortedCats.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold font-display">Répartition des Dépenses par Catégorie</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Catégorie</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Montant (FCFA)</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">% du Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.sortedCats.map(([name, amount], i) => {
                  const pct = stats.expenses > 0 ? ((amount / stats.expenses) * 100).toFixed(1) : "0";
                  return (
                    <tr key={name} className={cn("border-b border-border/50", i % 2 && "bg-muted/20")}>
                      <td className="py-2 px-3 font-medium">{name}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatXAF(amount)}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Engagements */}
      {activeEngagements.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-destructive/5">
            <h2 className="text-sm font-bold font-display text-destructive">Engagements en Cours (à payer)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Bénéficiaire</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Référence</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Montant</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Échéance</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Priorité</th>
                </tr>
              </thead>
              <tbody>
                {activeEngagements.map((o, i) => {
                  const p = getPriority(o.due_date);
                  return (
                    <tr key={o.id} className={cn("border-b border-border/50", i % 2 && "bg-muted/20")}>
                      <td className="py-2 px-3 font-medium">{o.person_name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{o.description || "-"}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatXAF(o.remaining_amount)}</td>
                      <td className="py-2 px-3">{o.due_date ? new Date(o.due_date).toLocaleDateString("fr-FR") : "-"}</td>
                      <td className={cn("py-2 px-3 font-semibold", p.color)}>{p.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Créances */}
      {activeCreances.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-primary/5">
            <h2 className="text-sm font-bold font-display text-primary">Créances en Cours (à recevoir)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Facture</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Montant</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Échéance</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {activeCreances.map((o, i) => {
                  const s = getStatut(o.due_date);
                  return (
                    <tr key={o.id} className={cn("border-b border-border/50", i % 2 && "bg-muted/20")}>
                      <td className="py-2 px-3 font-medium">{o.person_name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{o.description || "-"}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatXAF(o.remaining_amount)}</td>
                      <td className="py-2 px-3">{o.due_date ? new Date(o.due_date).toLocaleDateString("fr-FR") : "-"}</td>
                      <td className={cn("py-2 px-3 font-semibold", s.color)}>{s.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.count === 0 && activeObligations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune donnée pour {monthLabel}.
        </p>
      )}

      {/* Floating PDF button */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <Button
          onClick={handleExportPDF}
          className="pointer-events-auto rounded-full shadow-lg px-6 gap-2"
        >
          <Printer className="h-4 w-4" />
          Exporter en PDF
        </Button>
      </div>
    </div>
  );
};

export default Report;

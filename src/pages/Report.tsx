import { useState, useMemo } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Filter,
  ChevronDown,
  Printer,
} from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { useAllTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Transaction, Category, Account } from "@/lib/types";

const Report = () => {
  const { data: transactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Default: current month
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (categoryId && t.category_id !== categoryId) return false;
      if (accountId && t.account_id !== accountId) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo, categoryId, accountId]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filtered]
  );

  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const byCat: Record<string, number> = {};
    const byAcc: Record<string, number> = {};

    filtered.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else {
        expenses += Math.abs(t.amount);
        const catName = catMap.get(t.category_id)?.name ?? "Autre";
        byCat[catName] = (byCat[catName] ?? 0) + Math.abs(t.amount);
      }
      const accName = accMap.get(t.account_id)?.name ?? "Inconnu";
      byAcc[accName] = (byAcc[accName] ?? 0) + Math.abs(t.amount);
    });

    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const sortedAccs = Object.entries(byAcc).sort((a, b) => b[1] - a[1]);

    return { income, expenses, net: income - expenses, count: filtered.length, sortedCats, sortedAccs };
  }, [filtered, catMap, accMap]);

  const incomeTxs = sorted.filter((t) => t.amount > 0);
  const expenseTxs = sorted.filter((t) => t.amount < 0);

  const periodLabel = useMemo(() => {
    if (!dateFrom && !dateTo) return "Toutes les dates";
    const from = dateFrom
      ? new Date(dateFrom).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "...";
    const to = dateTo
      ? new Date(dateTo).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "...";
    return `${from} — ${to}`;
  }, [dateFrom, dateTo]);

  const hasFilters = categoryId || accountId;

  // Export to printable HTML
  const handlePrint = () => {
    const catRows = stats.sortedCats
      .map(
        ([cat, amt]) => {
          const pct = stats.expenses > 0 ? ((amt / stats.expenses) * 100).toFixed(1) : "0";
          return `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${cat}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${formatXAF(amt)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${pct}%</td></tr>`;
        }
      )
      .join("");

    const accRows = stats.sortedAccs
      .map(
        ([acc, amt]) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${acc}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${formatXAF(amt)}</td></tr>`
      )
      .join("");

    const incomeRows = incomeTxs
      .map(
        (t, i) =>
          `<tr><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">ENT-${String(i + 1).padStart(3, "0")}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${new Date(t.date).toLocaleDateString("fr-FR")}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${catMap.get(t.category_id)?.name ?? "-"}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${t.label}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:11px;font-weight:600">${formatXAF(t.amount)}</td></tr>`
      )
      .join("");

    const expenseRows = expenseTxs
      .map(
        (t, i) =>
          `<tr><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">DEP-${String(i + 1).padStart(3, "0")}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${new Date(t.date).toLocaleDateString("fr-FR")}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${catMap.get(t.category_id)?.name ?? "-"}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-size:11px">${t.label}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:11px;font-weight:600">${formatXAF(Math.abs(t.amount))}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Financier - ${periodLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 30px auto; color: #1a1a1a; font-size: 13px; }
    h1 { font-size: 18px; margin-bottom: 2px; }
    h2 { font-size: 14px; margin: 24px 0 8px; border-bottom: 2px solid #f0f0f0; padding-bottom: 4px; }
    .meta { color: #888; font-size: 11px; margin-bottom: 20px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .card { background: #f8f8f8; border-radius: 8px; padding: 12px; text-align: center; }
    .card .lbl { font-size: 10px; color: #888; text-transform: uppercase; }
    .card .val { font-size: 16px; font-weight: 700; margin-top: 4px; }
    .green { color: #16a34a; } .red { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { text-align: left; padding: 6px 8px; background: #f4f4f4; font-size: 11px; font-weight: 600; }
    th:last-child { text-align: right; }
    @media print { body { margin: 15px; } }
  </style>
</head>
<body>
  <h1>Rapport Financier</h1>
  <p class="meta">${periodLabel} · Généré le ${new Date().toLocaleDateString("fr-FR")} · ${stats.count} transactions</p>

  <div class="grid3">
    <div class="card"><div class="lbl">Total Entrées</div><div class="val green">${formatXAF(stats.income)}</div></div>
    <div class="card"><div class="lbl">Total Dépenses</div><div class="val red">${formatXAF(stats.expenses)}</div></div>
    <div class="card"><div class="lbl">Solde Net</div><div class="val" style="color:${stats.net >= 0 ? '#16a34a' : '#dc2626'}">${stats.net >= 0 ? '+' : ''}${formatXAF(stats.net)}</div></div>
  </div>

  ${incomeTxs.length > 0 ? `<h2>Entrées</h2>
  <table><thead><tr><th>Code</th><th>Date</th><th>Catégorie</th><th>Description</th><th style="text-align:right">Montant</th></tr></thead><tbody>${incomeRows}</tbody></table>` : ''}

  ${expenseTxs.length > 0 ? `<h2>Dépenses</h2>
  <table><thead><tr><th>Code</th><th>Date</th><th>Catégorie</th><th>Description</th><th style="text-align:right">Montant</th></tr></thead><tbody>${expenseRows}</tbody></table>` : ''}

  <h2>Répartition des Dépenses par Catégorie</h2>
  <table><thead><tr><th>Catégorie</th><th style="text-align:right">Montant</th><th style="text-align:right">% du Total</th></tr></thead><tbody>${catRows}</tbody></table>

  <h2>Répartition par Compte</h2>
  <table><thead><tr><th>Compte</th><th style="text-align:right">Montant</th></tr></thead><tbody>${accRows}</tbody></table>

  <p style="margin-top:24px;font-size:10px;color:#999;text-align:center;">Généré par Kuna Finance · ${new Date().toLocaleDateString("fr-FR")}</p>
  <script>window.print();</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className="px-4 pt-6 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Rapport
        </h1>
        <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1.5" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5" />
          PDF
        </Button>
      </div>

      {/* Period */}
      <p className="text-xs text-muted-foreground text-center">{periodLabel}</p>

      {/* Filters */}
      <div className="space-y-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all w-full justify-center",
            hasFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtres
          <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
        </button>

        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-3 space-y-3 animate-fade-in">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Du</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Au</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Account filter */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Compte</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setAccountId("")}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all",
                    !accountId ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  Tous
                </button>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all",
                      accountId === acc.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Catégorie</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryId("")}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all",
                    !categoryId ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  Toutes
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all",
                      categoryId === cat.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Executive Summary */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold font-display">Résumé Exécutif</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center">
            <TrendingUp className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Entrées</p>
            <p className="text-xs font-bold font-display text-primary">{formatXAF(stats.income)}</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-2.5 text-center">
            <TrendingDown className="h-3.5 w-3.5 text-destructive mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Dépenses</p>
            <p className="text-xs font-bold font-display text-destructive">{formatXAF(stats.expenses)}</p>
          </div>
          <div className="rounded-lg bg-muted p-2.5 text-center">
            <ArrowRightLeft className="h-3.5 w-3.5 text-foreground mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Solde Net</p>
            <p className={cn("text-xs font-bold font-display", stats.net >= 0 ? "text-primary" : "text-destructive")}>
              {stats.net >= 0 ? "+" : ""}{formatXAF(stats.net)}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          {stats.count} transactions
        </p>
      </div>

      {/* Category breakdown */}
      {stats.sortedCats.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold font-display">Dépenses par Catégorie</h2>
          <div className="space-y-2">
            {stats.sortedCats.map(([name, amount]) => {
              const pct = stats.expenses > 0 ? (amount / stats.expenses) * 100 : 0;
              return (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</span>
                      <span className="text-[11px] font-semibold text-foreground w-24 text-right">{formatXAF(amount)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account breakdown */}
      {stats.sortedAccs.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold font-display">Répartition par Compte</h2>
          <div className="space-y-2">
            {stats.sortedAccs.map(([name, amount]) => {
              const total = stats.income + stats.expenses;
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground">{name}</span>
                    <span className="text-[11px] font-semibold text-foreground">{formatXAF(amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-foreground/40 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Income transactions table */}
      {incomeTxs.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold font-display text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Entrées ({incomeTxs.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {incomeTxs.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2 px-4 py-2.5">
                <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0 font-mono">
                  ENT-{String(i + 1).padStart(3, "0")}
                </span>
                <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
                  {new Date(t.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {catMap.get(t.category_id)?.name} · {accMap.get(t.account_id)?.name}
                  </p>
                </div>
                <span className="text-[11px] font-bold font-display text-primary whitespace-nowrap">
                  {formatXAF(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense transactions table */}
      {expenseTxs.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold font-display text-destructive flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Dépenses ({expenseTxs.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {expenseTxs.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2 px-4 py-2.5">
                <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0 font-mono">
                  DEP-{String(i + 1).padStart(3, "0")}
                </span>
                <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
                  {new Date(t.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {catMap.get(t.category_id)?.name} · {accMap.get(t.account_id)?.name}
                  </p>
                </div>
                <span className="text-[11px] font-bold font-display text-foreground whitespace-nowrap">
                  {formatXAF(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.count === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune transaction pour cette période.
        </p>
      )}
    </div>
  );
};

export default Report;

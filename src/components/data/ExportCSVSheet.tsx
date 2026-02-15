import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { useAllTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportCSVSheet = ({ open, onOpenChange }: Props) => {
  const { data: transactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));

  const handleExport = () => {
    const filtered = transactions.filter(
      (t) => t.date >= dateFrom && t.date <= dateTo
    );

    const header = "Date,Libellé,Montant,Catégorie,Compte,Statut\n";
    const rows = filtered
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) =>
        [
          t.date,
          `"${t.label.replace(/"/g, '""')}"`,
          t.amount,
          `"${catMap.get(t.category_id) ?? ""}"`,
          `"${accMap.get(t.account_id) ?? ""}"`,
          t.status,
        ].join(",")
      )
      .join("\n");

    const csv = "\uFEFF" + header + rows; // BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  const count = transactions.filter(
    (t) => t.date >= dateFrom && t.date <= dateTo
  ).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter en CSV
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Du</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Au</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {count} transaction{count > 1 ? "s" : ""} à exporter
          </p>
          <Button className="w-full" onClick={handleExport} disabled={count === 0}>
            Télécharger le CSV
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExportCSVSheet;

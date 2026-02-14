import { useState } from "react";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Category, CategoryType, CategoryNature } from "@/lib/types";

const NATURE_LABELS: Record<CategoryNature, string> = {
  Essential: "Essentiel",
  Desire: "Désir",
  Savings: "Épargne",
};

const NATURE_COLORS: Record<CategoryNature, string> = {
  Essential: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Desire: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Savings: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const CategoryManager = () => {
  const { data: categories = [] } = useCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("Expense");
  const [nature, setNature] = useState<CategoryNature>("Essential");

  const expenseCategories = categories.filter((c) => c.type === "Expense");
  const incomeCategories = categories.filter((c) => c.type === "Income");

  const openAdd = () => {
    setEditing(null);
    setName("");
    setType("Expense");
    setNature("Essential");
    setSheetOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setNature(cat.nature);
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Le nom est requis");
      return;
    }
    if (editing) {
      updateCategory.mutate(
        { id: editing.id, name: trimmed, type, nature },
        {
          onSuccess: () => { toast.success("Catégorie modifiée"); setSheetOpen(false); },
          onError: () => toast.error("Erreur lors de la modification"),
        }
      );
    } else {
      addCategory.mutate(
        { name: trimmed, type, nature },
        {
          onSuccess: () => { toast.success("Catégorie ajoutée"); setSheetOpen(false); },
          onError: () => toast.error("Erreur lors de l'ajout"),
        }
      );
    }
  };

  const handleDelete = (cat: Category) => {
    deleteCategory.mutate(cat.id, {
      onSuccess: () => toast.success(`"${cat.name}" supprimée`),
      onError: () => toast.error("Impossible de supprimer (utilisée dans des transactions ?)"),
    });
  };

  const renderList = (list: Category[], title: string) => (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {list.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Aucune catégorie.</p>
      )}
      <div className="space-y-1">
        {list.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium truncate">{cat.name}</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", NATURE_COLORS[cat.nature])}>
                {NATURE_LABELS[cat.nature]}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold font-display">Catégories</h2>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Ajouter
        </Button>
      </div>

      {renderList(expenseCategories, "Dépenses")}
      {renderList(incomeCategories, "Revenus")}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                placeholder="Ex: Assurance, Cadeaux..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expense">Dépense</SelectItem>
                  <SelectItem value="Income">Revenu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nature</Label>
              <Select value={nature} onValueChange={(v) => setNature(v as CategoryNature)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Essential">Essentiel</SelectItem>
                  <SelectItem value="Desire">Désir</SelectItem>
                  <SelectItem value="Savings">Épargne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={addCategory.isPending || updateCategory.isPending}>
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CategoryManager;

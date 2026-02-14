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

const COLOR_PALETTE = [
  { name: "red", bg: "bg-red-500", ring: "ring-red-500" },
  { name: "orange", bg: "bg-orange-500", ring: "ring-orange-500" },
  { name: "amber", bg: "bg-amber-500", ring: "ring-amber-500" },
  { name: "yellow", bg: "bg-yellow-500", ring: "ring-yellow-500" },
  { name: "green", bg: "bg-green-500", ring: "ring-green-500" },
  { name: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { name: "blue", bg: "bg-blue-500", ring: "ring-blue-500" },
  { name: "indigo", bg: "bg-indigo-500", ring: "ring-indigo-500" },
  { name: "violet", bg: "bg-violet-500", ring: "ring-violet-500" },
  { name: "rose", bg: "bg-rose-500", ring: "ring-rose-500" },
];

const getColorClasses = (color: string) => {
  return COLOR_PALETTE.find((c) => c.name === color) ?? COLOR_PALETTE[6]; // default blue
};

interface Props {
  filterType?: "Expense" | "Income";
}

const CategoryManager = ({ filterType }: Props) => {
  const { data: categories = [] } = useCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("Expense");
  const [nature, setNature] = useState<CategoryNature>("Essential");
  const [color, setColor] = useState("blue");

  const filtered = filterType
    ? categories.filter((c) => c.type === filterType)
    : categories;

  const expenseCategories = filtered.filter((c) => c.type === "Expense");
  const incomeCategories = filtered.filter((c) => c.type === "Income");

  const openAdd = () => {
    setEditing(null);
    setName("");
    setType(filterType ?? "Expense");
    setNature("Essential");
    setColor("blue");
    setSheetOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setNature(cat.nature);
    setColor(cat.color || "blue");
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
        { id: editing.id, name: trimmed, type, nature, color },
        {
          onSuccess: () => { toast.success("Catégorie modifiée"); setSheetOpen(false); },
          onError: () => toast.error("Erreur lors de la modification"),
        }
      );
    } else {
      addCategory.mutate(
        { name: trimmed, type, nature, color },
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
      {!filterType && (
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      )}
      {list.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Aucune catégorie.</p>
      )}
      <div className="space-y-1">
        {list.map((cat) => {
          const cc = getColorClasses(cat.color);
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("h-3 w-3 rounded-full flex-shrink-0", cc.bg)} />
                <span className="text-sm font-medium truncate">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground">
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
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold font-display">
          {filterType ? (filterType === "Expense" ? "Dépenses" : "Revenus") : "Catégories"}
        </h2>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Ajouter
        </Button>
      </div>

      {filterType ? (
        renderList(filtered, "")
      ) : (
        <>
          {renderList(expenseCategories, "Dépenses")}
          {renderList(incomeCategories, "Revenus")}
        </>
      )}

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
            {!filterType && (
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
            )}
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
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      c.bg,
                      color === c.name ? `ring-2 ring-offset-2 ring-offset-background ${c.ring}` : "hover:scale-110"
                    )}
                  />
                ))}
              </div>
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

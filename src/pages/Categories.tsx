import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CategoryManager from "@/components/categories/CategoryManager";

const Categories = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type");

  const filterType = typeParam === "income" ? "Income" as const : typeParam === "expense" ? "Expense" as const : undefined;
  const title = filterType === "Expense" ? "Catégories de dépenses" : filterType === "Income" ? "Catégories de revenus" : "Catégories";

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/settings")}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold font-display">{title}</h1>
      </div>

      <CategoryManager filterType={filterType} />
    </div>
  );
};

export default Categories;

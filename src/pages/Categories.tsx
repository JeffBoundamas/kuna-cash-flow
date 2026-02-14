import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CategoryManager from "@/components/categories/CategoryManager";

const Categories = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/settings")}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold font-display">Catégories</h1>
      </div>

      <CategoryManager />
    </div>
  );
};

export default Categories;

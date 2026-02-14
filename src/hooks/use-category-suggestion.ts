import { useMemo } from "react";
import type { Category, Transaction } from "@/lib/types";

// Keyword-based mapping for common labels
const KEYWORD_MAP: Record<string, string> = {
  // Alimentation
  marché: "Alimentation", carrefour: "Alimentation", supermarché: "Alimentation",
  bouffe: "Alimentation", nourriture: "Alimentation", vivres: "Alimentation",
  boulangerie: "Alimentation", pain: "Alimentation", légumes: "Alimentation",
  // Transport
  taxi: "Transport", moto: "Transport", bus: "Transport", essence: "Transport",
  carburant: "Transport", péage: "Transport", uber: "Transport", yango: "Transport",
  // Restaurant
  restaurant: "Restaurant", resto: "Restaurant", brasserie: "Restaurant",
  snack: "Restaurant", repas: "Restaurant", déjeuner: "Restaurant",
  // Loyer
  loyer: "Loyer", appartement: "Loyer", maison: "Loyer",
  // Électricité
  eneo: "Électricité", électricité: "Électricité", courant: "Électricité",
  // Santé
  pharmacie: "Santé", médicament: "Santé", hôpital: "Santé",
  clinique: "Santé", docteur: "Santé", médecin: "Santé",
  // Éducation
  école: "Éducation", scolarité: "Éducation", formation: "Éducation",
  livres: "Éducation", cours: "Éducation",
  // Loisirs
  cinéma: "Loisirs", film: "Loisirs", sortie: "Loisirs", fête: "Loisirs",
  concert: "Loisirs", match: "Loisirs",
  // Shopping
  vêtements: "Shopping", habits: "Shopping", chaussures: "Shopping",
  boutique: "Shopping", achat: "Shopping",
  // Épargne
  épargne: "Épargne", économies: "Épargne",
  // Investissement
  investissement: "Investissement", placement: "Investissement",
  // Salaire
  salaire: "Salaire", paie: "Salaire", virement: "Salaire",
  // Freelance
  freelance: "Freelance", mission: "Freelance", prestation: "Freelance",
};

export const useCategorySuggestion = (
  label: string,
  categories: Category[],
  transactions: Transaction[],
  type: "expense" | "income"
): string | null => {
  return useMemo(() => {
    if (!label.trim() || categories.length === 0) return null;

    const lowerLabel = label.toLowerCase().trim();
    const filtered = categories.filter((c) =>
      type === "income" ? c.type === "Income" : c.type === "Expense"
    );

    // 1. Habit memory: find past transactions with same label
    const pastMatch = transactions.find(
      (tx) => tx.label.toLowerCase().trim() === lowerLabel
    );
    if (pastMatch) {
      const matchedCat = filtered.find((c) => c.id === pastMatch.category_id);
      if (matchedCat) return matchedCat.id;
    }

    // 2. Keyword matching
    for (const [keyword, catName] of Object.entries(KEYWORD_MAP)) {
      if (lowerLabel.includes(keyword)) {
        const matchedCat = filtered.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        );
        if (matchedCat) return matchedCat.id;
      }
    }

    return null;
  }, [label, categories, transactions, type]);
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: "Bank" | "Mobile Money" | "Cash" | "Tontine";
  color: string;
  allow_negative_balance: boolean;
  initial_balance: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORY_MAP: Record<string, "Bank" | "Mobile Money" | "Cash" | "Tontine"> = {
  cash: "Cash",
  bank_account: "Bank",
  mobile_money: "Mobile Money",
  credit_card: "Bank",
  check: "Bank",
};

const TYPE_FROM_CATEGORY: Record<string, string> = {
  Cash: "cash",
  Bank: "bank_account",
  "Mobile Money": "mobile_money",
  Tontine: "cash",
};

export const TYPE_LABELS: Record<string, string> = {
  cash: "Espèces",
  bank_account: "Compte bancaire",
  mobile_money: "Mobile Money",
  credit_card: "Carte bancaire",
  check: "Chèque",
};

export function getCategoryFromType(type: string) {
  return CATEGORY_MAP[type] || "Cash";
}

export function getTypeFromCategory(category: string) {
  return TYPE_FROM_CATEGORY[category] || "cash";
}

export function usePaymentMethods() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payment_methods", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!user,
  });
}

export function useActivePaymentMethods() {
  const { data = [], ...rest } = usePaymentMethods();
  return { data: data.filter((pm) => pm.is_active), ...rest };
}

export function useAddPaymentMethod() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      type: string;
      icon: string;
      color: string;
      initial_balance: number;
      allow_negative_balance: boolean;
    }) => {
      const { error } = await supabase.from("payment_methods").insert({
        user_id: user!.id,
        name: input.name,
        icon: input.icon,
        category: getCategoryFromType(input.type),
        color: input.color,
        initial_balance: input.initial_balance,
        allow_negative_balance: input.allow_negative_balance,
        sort_order: 999,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
      toast.success("Moyen de paiement ajouté");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
      toast.success("Moyen de paiement supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

export function usePaymentMethodTransactionCount(pmId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["pm_tx_count", pmId],
    queryFn: async () => {
      // We can't directly link since payment_methods and transactions use different tables
      // For now return 0 - integration will come later
      return 0;
    },
    enabled: !!user && !!pmId,
  });
}

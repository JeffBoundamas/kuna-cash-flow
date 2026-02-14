import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Budget } from "@/lib/types";

export const useBudgets = (month: number, year: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["budgets", user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .eq("year", year);
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
    enabled: !!user,
  });
};

export const useUpsertBudget = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { category_id: string; amount_limit: number; month: number; year: number; id?: string }) => {
      if (!user) throw new Error("Not authenticated");

      if (input.id) {
        const { error } = await supabase
          .from("budgets")
          .update({ amount_limit: input.amount_limit })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets").insert({
          user_id: user.id,
          category_id: input.category_id,
          amount_limit: input.amount_limit,
          month: input.month,
          year: input.year,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};

export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};

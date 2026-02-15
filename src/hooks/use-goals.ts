import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Goal } from "@/lib/types";

export const useGoals = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("is_emergency_fund", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
    enabled: !!user,
  });
};

export const useAddGoal = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (goal: {
      name: string;
      target_amount: number;
      deadline: string;
      icon?: string;
      is_emergency_fund?: boolean;
    }) => {
      const { error } = await supabase.from("goals").insert([{
        user_id: user!.id,
        name: goal.name,
        target_amount: goal.target_amount,
        deadline: goal.deadline,
        icon: goal.icon || "target",
        is_emergency_fund: goal.is_emergency_fund || false,
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { error } = await supabase.from("goals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useAddFundsToGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, amount, accountId }: { goalId: string; amount: number; accountId: string }) => {
      // Get current goal amount
      const { data: goal, error: goalErr } = await supabase
        .from("goals")
        .select("current_amount")
        .eq("id", goalId)
        .single();
      if (goalErr) throw goalErr;

      // Get current account balance
      const { data: account, error: accErr } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", accountId)
        .single();
      if (accErr) throw accErr;

      if (account.balance < amount) {
        throw new Error("Solde insuffisant sur ce compte");
      }

      // Update goal
      const { error: updateGoalErr } = await supabase
        .from("goals")
        .update({ current_amount: goal.current_amount + amount })
        .eq("id", goalId);
      if (updateGoalErr) throw updateGoalErr;

      // Deduct from account
      const { error: updateAccErr } = await supabase
        .from("accounts")
        .update({ balance: account.balance - amount })
        .eq("id", accountId);
      if (updateAccErr) throw updateAccErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

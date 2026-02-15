import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAddTransaction } from "./use-transactions";

export type RecurringFrequency = "daily" | "weekly" | "monthly";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  label: string;
  frequency: RecurringFrequency;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useRecurringTransactions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recurring-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecurringTransaction[];
    },
    enabled: !!user,
  });
};

export const useAddRecurringTransaction = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rt: {
      account_id: string;
      category_id: string;
      amount: number;
      label: string;
      frequency: RecurringFrequency;
      next_due_date?: string;
    }) => {
      const { error } = await supabase.from("recurring_transactions").insert([{
        user_id: user!.id,
        ...rt,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });
};

function addFrequency(date: string, frequency: RecurringFrequency): string {
  const d = new Date(date);
  if (frequency === "daily") d.setDate(d.getDate() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

/** Generate all due recurring transactions. Call on app open. */
export const useGenerateRecurring = () => {
  const { user } = useAuth();
  const addTransaction = useAddTransaction();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];

      const { data: recurrings, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("is_active", true)
        .lte("next_due_date", today);

      if (error) throw error;
      if (!recurrings || recurrings.length === 0) return;

      for (const rt of recurrings as RecurringTransaction[]) {
        // Create the transaction
        await addTransaction.mutateAsync({
          account_id: rt.account_id,
          category_id: rt.category_id,
          amount: rt.amount,
          label: rt.label,
          date: rt.next_due_date,
        });

        // Advance next_due_date
        const nextDate = addFrequency(rt.next_due_date, rt.frequency);
        await supabase
          .from("recurring_transactions")
          .update({ next_due_date: nextDate })
          .eq("id", rt.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

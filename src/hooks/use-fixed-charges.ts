import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { FixedCharge, FixedChargeFrequency } from "@/lib/fixed-charge-types";

export const useFixedCharges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["fixed-charges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixed_charges")
        .select("*")
        .order("due_day", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FixedCharge[];
    },
    enabled: !!user,
  });
};

export const useAddFixedCharge = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (charge: {
      name: string;
      amount: number;
      frequency: FixedChargeFrequency;
      due_day: number;
      category_id?: string;
      payment_method_id?: string;
      beneficiary: string;
      auto_generate_obligation?: boolean;
      reminder_days_before?: number;
      start_date: string;
      end_date?: string;
    }) => {
      const { error } = await supabase.from("fixed_charges").insert([{
        user_id: user!.id,
        name: charge.name,
        amount: charge.amount,
        frequency: charge.frequency,
        due_day: charge.due_day,
        category_id: charge.category_id || null,
        payment_method_id: charge.payment_method_id || null,
        beneficiary: charge.beneficiary,
        auto_generate_obligation: charge.auto_generate_obligation ?? true,
        reminder_days_before: charge.reminder_days_before ?? 3,
        start_date: charge.start_date,
        end_date: charge.end_date || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixed-charges"] });
    },
  });
};

export const useUpdateFixedCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FixedCharge> & { id: string }) => {
      const { error } = await supabase
        .from("fixed_charges")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixed-charges"] });
    },
  });
};

export const useDeleteFixedCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fixed_charges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixed-charges"] });
    },
  });
};

/** Check if a fixed charge has been paid for the current period */
export function isChargePayedThisPeriod(
  charge: FixedCharge,
  obligations: { linked_fixed_charge_id?: string | null; status: string; due_date?: string | null }[]
): "paid" | "due" | "overdue" {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const matchingOb = obligations.find(o => {
    if (o.linked_fixed_charge_id !== charge.id) return false;
    if (!o.due_date) return false;
    const d = new Date(o.due_date);
    if (charge.frequency === "monthly") {
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
    if (charge.frequency === "quarterly") {
      const q = Math.floor(currentMonth / 3);
      const oq = Math.floor(d.getMonth() / 3);
      return oq === q && d.getFullYear() === currentYear;
    }
    // yearly
    return d.getFullYear() === currentYear;
  });

  if (!matchingOb) return "due";
  if (matchingOb.status === "settled") return "paid";

  // Check if overdue
  if (matchingOb.due_date) {
    const dueDate = new Date(matchingOb.due_date);
    if (dueDate < now) return "overdue";
  }

  return "due";
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PaymentMethod } from "@/lib/payment-method-types";

const KEY = ["payment_methods"];

export const usePaymentMethods = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PaymentMethod[];
    },
    enabled: !!user,
  });
};

export const useActivePaymentMethods = () => {
  const { data = [], ...rest } = usePaymentMethods();
  return { data: data.filter((pm) => pm.is_active), ...rest };
};

export const useAddPaymentMethod = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pm: Omit<PaymentMethod, "id" | "user_id" | "created_at" | "updated_at" | "category">) => {
      const { error } = await supabase.from("payment_methods").insert([{
        user_id: user!.id,
        name: pm.name,
        icon: pm.icon,
        color: pm.color,
        allow_negative_balance: pm.allow_negative_balance,
        initial_balance: pm.initial_balance,
        is_active: pm.is_active,
        sort_order: pm.sort_order,
        method_type: pm.method_type as any,
        category: pm.method_type === "cash" ? "Cash" : pm.method_type === "mobile_money" ? "Mobile Money" : "Bank",
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useUpdatePaymentMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentMethod> & { id: string }) => {
      const payload: Record<string, any> = { ...updates };
      delete payload.user_id;
      delete payload.created_at;
      delete payload.updated_at;
      if (updates.method_type) {
        payload.method_type = updates.method_type as any;
      }
      const { error } = await supabase.from("payment_methods").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeletePaymentMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useReorderPaymentMethods = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase.from("payment_methods").update({ sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};

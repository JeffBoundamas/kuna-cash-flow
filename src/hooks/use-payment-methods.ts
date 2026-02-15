import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AccountType } from "@/lib/types";

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: AccountType;
  created_at: string;
}

export const usePaymentMethods = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["payment-methods", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return (data ?? []) as PaymentMethod[];
    },
    enabled: !!user,
  });
};

export const useAddPaymentMethod = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pm: { name: string; icon: string; category: AccountType }) => {
      const { error } = await supabase.from("payment_methods").insert([{
        user_id: user!.id,
        ...pm,
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
};

export const useDeletePaymentMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
};

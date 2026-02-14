import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Account } from "@/lib/types";

export const useAccounts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
    enabled: !!user,
  });
};

export const useAddAccount = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (account: { name: string; type: "Bank" | "Mobile Money" | "Cash" | "Tontine"; balance: number; icon: string }) => {
      const { error } = await supabase.from("accounts").insert([{
        user_id: user!.id,
        ...account,
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
};

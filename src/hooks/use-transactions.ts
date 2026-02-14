import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Transaction } from "@/lib/types";

export const useTransactions = (month?: number, year?: number) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          qc.invalidateQueries({ queryKey: ["transactions"] });
          qc.invalidateQueries({ queryKey: ["accounts"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["transactions", user?.id, month, year],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (month !== undefined && year !== undefined) {
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, "0")}-01`;
        query = query.gte("date", startDate).lt("date", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
    enabled: !!user,
  });
};

export const useAddTransaction = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tx: {
      account_id: string;
      category_id: string;
      amount: number;
      label: string;
      status?: "Planned" | "Realized";
      date?: string;
      sms_reference?: string;
    }) => {
      const { error } = await supabase.from("transactions").insert([{
        user_id: user!.id,
        ...tx,
      }]);
      if (error) throw error;

      // Update account balance
      const { data: account } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", tx.account_id)
        .maybeSingle();
      if (account) {
        await supabase
          .from("accounts")
          .update({ balance: account.balance + tx.amount })
          .eq("id", tx.account_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

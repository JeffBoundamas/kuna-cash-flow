import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Transaction } from "@/lib/types";

export const useTransactions = (month?: number, year?: number) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          qc.invalidateQueries({ queryKey: ["transactions"] });
          qc.invalidateQueries({ queryKey: ["payment_methods"] });
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

export const useAllTransactions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
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
      category_id: string;
      amount: number;
      label: string;
      status?: "Planned" | "Realized";
      date?: string;
      sms_reference?: string;
      payment_method_id?: string;
    }) => {
      const payload = {
        user_id: user!.id,
        category_id: tx.category_id,
        amount: tx.amount,
        label: tx.label || "Transaction",
        date: tx.date,
        sms_reference: tx.sms_reference,
        payment_method_id: tx.payment_method_id,
        ...(tx.status ? { status: tx.status } : {}),
      };
      const { error } = await supabase.from("transactions").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      category_id: string;
      amount: number;
      label: string;
      date?: string;
      sms_reference?: string | null;
      payment_method_id?: string;
    }) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          category_id: updates.category_id,
          amount: updates.amount,
          label: updates.label,
          date: updates.date,
          sms_reference: updates.sms_reference,
          payment_method_id: updates.payment_method_id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Obligation, ObligationPayment, ObligationType, ObligationConfidence } from "@/lib/obligation-types";

export const useObligations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["obligations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obligations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Obligation[];
    },
    enabled: !!user,
  });
};

export const useObligationPayments = (obligationId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["obligation-payments", obligationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obligation_payments")
        .select("*")
        .eq("obligation_id", obligationId!)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ObligationPayment[];
    },
    enabled: !!user && !!obligationId,
  });
};

export const useAddObligation = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ob: {
      type: ObligationType;
      person_name: string;
      description?: string;
      total_amount: number;
      due_date?: string;
      confidence?: ObligationConfidence;
    }) => {
      const { error } = await supabase.from("obligations").insert([{
        user_id: user!.id,
        type: ob.type,
        person_name: ob.person_name,
        description: ob.description || null,
        total_amount: ob.total_amount,
        remaining_amount: ob.total_amount,
        due_date: ob.due_date || null,
        confidence: ob.confidence || "certain",
        status: "active" as const,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligations"] });
    },
  });
};

export const useLogObligationPayment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      obligation: Obligation;
      amount: number;
      payment_date: string;
      payment_method_id: string;
      notes?: string;
    }) => {
      const { obligation, amount, payment_date, payment_method_id, notes } = params;

      // 1. Create payment record
      const { error: payError } = await supabase.from("obligation_payments").insert([{
        obligation_id: obligation.id,
        user_id: user!.id,
        amount,
        payment_date,
        payment_method_id,
        notes: notes || null,
      }]);
      if (payError) throw payError;

      // 2. Update remaining_amount
      const newRemaining = Math.max(0, obligation.remaining_amount - amount);
      const newStatus = newRemaining === 0 ? "settled" : "partially_paid";

      const { error: upError } = await supabase
        .from("obligations")
        .update({ remaining_amount: newRemaining, status: newStatus })
        .eq("id", obligation.id);
      if (upError) throw upError;

      // 3. Ensure category exists, then create transaction
      const catName = obligation.type === "creance" ? "Remboursement reçu" : "Remboursement dette";
      const catType = obligation.type === "creance" ? "Income" : "Expense";

      let { data: cats } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user!.id)
        .eq("name", catName)
        .limit(1);

      let categoryId: string;
      if (cats && cats.length > 0) {
        categoryId = cats[0].id;
      } else {
        const { data: newCat, error: catErr } = await supabase
          .from("categories")
          .insert([{
            user_id: user!.id,
            name: catName,
            type: catType,
            nature: "Essential" as const,
            color: obligation.type === "creance" ? "emerald" : "red",
          }])
          .select("id")
          .single();
        if (catErr) throw catErr;
        categoryId = newCat.id;
      }

      const txAmount = obligation.type === "creance" ? amount : -amount;
      const { error: txErr } = await supabase.from("transactions").insert([{
        user_id: user!.id,
        category_id: categoryId,
        amount: txAmount,
        label: `${catName} — ${obligation.person_name}`,
        date: payment_date,
        payment_method_id,
      }]);
      if (txErr) throw txErr;

      return { settled: newRemaining === 0 };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligations"] });
      qc.invalidateQueries({ queryKey: ["obligation-payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
};

export const useUpdateObligation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      person_name: string;
      description?: string;
      total_amount: number;
      due_date?: string;
      confidence?: ObligationConfidence;
      remaining_amount: number;
      original_total: number;
    }) => {
      const diff = params.total_amount - params.original_total;
      const newRemaining = Math.max(0, params.remaining_amount + diff);
      const { error } = await supabase
        .from("obligations")
        .update({
          person_name: params.person_name,
          description: params.description || null,
          total_amount: params.total_amount,
          remaining_amount: newRemaining,
          due_date: params.due_date || null,
          confidence: params.confidence || "certain",
        })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligations"] });
    },
  });
};

export const useCancelObligation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("obligations")
        .update({ status: "cancelled" as const })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligations"] });
    },
  });
};

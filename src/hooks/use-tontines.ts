import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tontine, TontineMember, TontinePayment } from "@/lib/tontine-types";

export const useTontines = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tontines", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tontines")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Tontine[];
    },
    enabled: !!user,
  });
};

export const useTontine = (id: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tontines", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tontines")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Tontine | null;
    },
    enabled: !!user && !!id,
  });
};

export const useTontineMembers = (tontineId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tontine_members", tontineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tontine_members")
        .select("*")
        .eq("tontine_id", tontineId)
        .order("position_in_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TontineMember[];
    },
    enabled: !!user && !!tontineId,
  });
};

export const useTontinePayments = (tontineId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tontine_payments", tontineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tontine_payments")
        .select("*")
        .eq("tontine_id", tontineId)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TontinePayment[];
    },
    enabled: !!user && !!tontineId,
  });
};

export const useCreateTontine = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      total_members: number;
      contribution_amount: number;
      frequency: "weekly" | "monthly";
      start_date: string;
      members: { name: string; is_current_user: boolean }[];
    }) => {
      if (!user) throw new Error("Not authenticated");
      // Create tontine
      const { data: tontine, error } = await supabase
        .from("tontines")
        .insert({
          user_id: user.id,
          name: input.name,
          total_members: input.total_members,
          contribution_amount: input.contribution_amount,
          frequency: input.frequency,
          start_date: input.start_date,
        })
        .select()
        .single();
      if (error) throw error;

      // Create members with calculated payout dates
      const startDate = new Date(input.start_date);
      const members = input.members.map((m, i) => {
        const payoutDate = new Date(startDate);
        if (input.frequency === "monthly") {
          payoutDate.setMonth(payoutDate.getMonth() + i);
        } else {
          payoutDate.setDate(payoutDate.getDate() + i * 7);
        }
        return {
          tontine_id: tontine.id,
          user_id: user.id,
          member_name: m.name,
          position_in_order: i + 1,
          is_current_user: m.is_current_user,
          payout_date: payoutDate.toISOString().split("T")[0],
        };
      });

      const { error: membersError } = await supabase
        .from("tontine_members")
        .insert(members);
      if (membersError) throw membersError;

      return tontine as Tontine;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontines"] });
    },
  });
};

export const useLogContribution = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      tontine_id: string;
      amount: number;
      cycle_number: number;
      linked_account_id: string;
      tontine_name: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Log payment
      const { error } = await supabase.from("tontine_payments").insert({
        tontine_id: input.tontine_id,
        user_id: user.id,
        amount: input.amount,
        cycle_number: input.cycle_number,
        type: "contribution" as const,
        linked_account_id: input.linked_account_id,
      });
      if (error) throw error;

      // Find tontine category
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "Tontine")
        .maybeSingle();

      // Create corresponding expense transaction
      if (categories) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: input.linked_account_id,
          category_id: categories.id,
          amount: -input.amount,
          label: `Cotisation - ${input.tontine_name}`,
          status: "Realized" as const,
        });

        // Debit account
        const { data: account } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", input.linked_account_id)
          .single();
        if (account) {
          await supabase
            .from("accounts")
            .update({ balance: account.balance - input.amount })
            .eq("id", input.linked_account_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontine_payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useReceivePot = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      tontine_id: string;
      amount: number;
      cycle_number: number;
      linked_account_id: string;
      tontine_name: string;
      member_id: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Log pot received
      const { error } = await supabase.from("tontine_payments").insert({
        tontine_id: input.tontine_id,
        user_id: user.id,
        amount: input.amount,
        cycle_number: input.cycle_number,
        type: "pot_received" as const,
        linked_account_id: input.linked_account_id,
      });
      if (error) throw error;

      // Mark member as received
      await supabase
        .from("tontine_members")
        .update({ has_received_pot: true })
        .eq("id", input.member_id);

      // Find tontine category
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "Tontine")
        .maybeSingle();

      // Create income transaction
      if (categories) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: input.linked_account_id,
          category_id: categories.id,
          amount: input.amount,
          label: `Pot reçu - ${input.tontine_name}`,
          status: "Realized" as const,
        });

        // Credit account
        const { data: account } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", input.linked_account_id)
          .single();
        if (account) {
          await supabase
            .from("accounts")
            .update({ balance: account.balance + input.amount })
            .eq("id", input.linked_account_id);
        }
      }

      // Advance cycle
      await supabase
        .from("tontines")
        .update({ current_cycle: input.cycle_number + 1 })
        .eq("id", input.tontine_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontines"] });
      qc.invalidateQueries({ queryKey: ["tontine_members"] });
      qc.invalidateQueries({ queryKey: ["tontine_payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useDeleteTontine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tontines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tontines"] }),
  });
};

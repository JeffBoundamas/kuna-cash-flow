import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tontine, TontineMember, TontinePayment } from "@/lib/tontine-types";
import type { ObligationType, ObligationConfidence } from "@/lib/obligation-types";

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

      // Auto-create obligations
      const myPosition = input.members.findIndex((m) => m.is_current_user);
      const potTotal = input.contribution_amount * input.members.length;
      const obligations: Array<{
        user_id: string;
        type: ObligationType;
        person_name: string;
        description: string;
        total_amount: number;
        remaining_amount: number;
        due_date: string;
        confidence: ObligationConfidence;
        status: "active";
        linked_tontine_id: string;
      }> = [];

      for (let cycle = 0; cycle < input.members.length; cycle++) {
        const dueDate = new Date(input.start_date);
        if (input.frequency === "monthly") {
          dueDate.setMonth(dueDate.getMonth() + cycle);
        } else {
          dueDate.setDate(dueDate.getDate() + cycle * 7);
        }
        obligations.push({
          user_id: user.id,
          type: "engagement",
          person_name: input.name,
          description: `Cotisation ${input.name} - Tour ${cycle + 1}`,
          total_amount: input.contribution_amount,
          remaining_amount: input.contribution_amount,
          due_date: dueDate.toISOString().split("T")[0],
          confidence: "certain",
          status: "active",
          linked_tontine_id: tontine.id,
        });
      }

      if (myPosition >= 0) {
        const payoutDate = new Date(input.start_date);
        if (input.frequency === "monthly") {
          payoutDate.setMonth(payoutDate.getMonth() + myPosition);
        } else {
          payoutDate.setDate(payoutDate.getDate() + myPosition * 7);
        }
        obligations.push({
          user_id: user.id,
          type: "creance",
          person_name: input.name,
          description: `Pot à recevoir - ${input.name}`,
          total_amount: potTotal,
          remaining_amount: potTotal,
          due_date: payoutDate.toISOString().split("T")[0],
          confidence: "certain",
          status: "active",
          linked_tontine_id: tontine.id,
        });
      }

      if (obligations.length > 0) {
        await supabase.from("obligations").insert(obligations);
      }

      return tontine as Tontine;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontines"] });
      qc.invalidateQueries({ queryKey: ["obligations"] });
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
      payment_method_id: string;
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
        payment_method_id: input.payment_method_id,
      });
      if (error) throw error;

      // Find or create tontine category
      let { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "Tontine")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!category) {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ user_id: user.id, name: "Tontine", type: "Expense" as const, nature: "Savings" as const, color: "yellow" })
          .select("id")
          .single();
        category = newCat;
      }

      // Create corresponding expense transaction
      if (category) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          category_id: category.id,
          amount: -input.amount,
          label: `Cotisation - ${input.tontine_name}`,
          status: "Realized" as const,
          payment_method_id: input.payment_method_id,
        });
      }

      // Auto-settle matching engagement obligation
      const { data: matchingObligation } = await supabase
        .from("obligations")
        .select("id, remaining_amount")
        .eq("linked_tontine_id", input.tontine_id)
        .eq("type", "engagement")
        .eq("status", "active")
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (matchingObligation) {
        const newRemaining = Math.max(0, matchingObligation.remaining_amount - input.amount);
        await supabase
          .from("obligations")
          .update({
            remaining_amount: newRemaining,
            status: newRemaining === 0 ? "settled" : "partially_paid",
          })
          .eq("id", matchingObligation.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontine_payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
      qc.invalidateQueries({ queryKey: ["obligations"] });
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
      payment_method_id: string;
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
        payment_method_id: input.payment_method_id,
      });
      if (error) throw error;

      // Mark member as received
      await supabase
        .from("tontine_members")
        .update({ has_received_pot: true })
        .eq("id", input.member_id);

      // Find or create tontine category
      let { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "Tontine")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!category) {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ user_id: user.id, name: "Tontine", type: "Expense" as const, nature: "Savings" as const, color: "yellow" })
          .select("id")
          .single();
        category = newCat;
      }

      // Create income transaction
      if (category) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          category_id: category.id,
          amount: input.amount,
          label: `Pot reçu - ${input.tontine_name}`,
          status: "Realized" as const,
          payment_method_id: input.payment_method_id,
        });
      }

      // Advance cycle
      await supabase
        .from("tontines")
        .update({ current_cycle: input.cycle_number + 1 })
        .eq("id", input.tontine_id);

      // Auto-settle créance obligation for pot received
      const { data: creanceObligation } = await supabase
        .from("obligations")
        .select("id")
        .eq("linked_tontine_id", input.tontine_id)
        .eq("type", "creance")
        .in("status", ["active", "partially_paid"])
        .maybeSingle();

      if (creanceObligation) {
        await supabase
          .from("obligations")
          .update({ remaining_amount: 0, status: "settled" })
          .eq("id", creanceObligation.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontines"] });
      qc.invalidateQueries({ queryKey: ["tontine_members"] });
      qc.invalidateQueries({ queryKey: ["tontine_payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
      qc.invalidateQueries({ queryKey: ["obligations"] });
    },
  });
};

export const useDeleteTontine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("obligations").delete().eq("linked_tontine_id", id);
      const { error } = await supabase.from("tontines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontines"] });
      qc.invalidateQueries({ queryKey: ["obligations"] });
    },
  });
};

export const useUpdateTontine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      contribution_amount: number;
      frequency: "weekly" | "monthly";
      start_date: string;
    }) => {
      const { error } = await supabase
        .from("tontines")
        .update({
          name: input.name,
          contribution_amount: input.contribution_amount,
          frequency: input.frequency,
          start_date: input.start_date,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontines"] });
    },
  });
};

export const useUpdateTontineMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      member_name?: string;
      position_in_order?: number;
      is_current_user?: boolean;
      phone_number?: string | null;
      payout_date?: string | null;
    }) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from("tontine_members")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontine_members"] });
    },
  });
};

export const useAddTontineMember = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      tontine_id: string;
      member_name: string;
      position_in_order: number;
      payout_date: string | null;
      phone_number?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tontine_members")
        .insert({
          ...input,
          user_id: user.id,
          is_current_user: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontine_members"] });
    },
  });
};

export const useDeleteTontineMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tontine_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontine_members"] });
    },
  });
};

export const useBatchUpdateMemberPositions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (members: { id: string; position_in_order: number; payout_date: string | null }[]) => {
      for (const m of members) {
        const { error } = await supabase
          .from("tontine_members")
          .update({ position_in_order: m.position_in_order, payout_date: m.payout_date })
          .eq("id", m.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tontine_members"] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const KEY = ["sms_imports"];

export interface SmsImport {
  id: string;
  user_id: string;
  raw_text: string;
  transaction_id: string;
  parsed_type: string;
  parsed_amount: number;
  parsed_fees: number;
  parsed_balance: number | null;
  parsed_recipient: string | null;
  parsed_reference: string | null;
  status: string;
  linked_transaction_id: string | null;
  created_at: string;
}

export const useSmsImports = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SmsImport[];
    },
    enabled: !!user,
  });
};

export const usePendingSmsCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...KEY, "pending-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sms_imports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_review");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
};

export const useCreateSmsImport = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (imp: {
      raw_text: string;
      transaction_id: string;
      parsed_type: "transfer_out" | "transfer_in" | "bundle" | "merchant_payment" | "bill_payment";
      parsed_amount: number;
      parsed_fees: number;
      parsed_balance: number | null;
      parsed_recipient: string | null;
      parsed_reference: string | null;
      status: "pending_review" | "confirmed" | "rejected" | "duplicate";
      linked_transaction_id?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("sms_imports")
        .insert([{ user_id: user.id, ...imp }])
        .select()
        .single();
      if (error) throw error;
      return data as SmsImport;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
};

export const useUpdateSmsImport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; linked_transaction_id?: string | null }) => {
      const { error } = await supabase
        .from("sms_imports")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
};

export const useCheckDuplicateTid = () => {
  const { user } = useAuth();
  return async (tid: string): Promise<boolean> => {
    if (!user) return false;
    const { count, error } = await supabase
      .from("sms_imports")
      .select("*", { count: "exact", head: true })
      .eq("transaction_id", tid)
      .eq("user_id", user.id);
    if (error) return false;
    return (count ?? 0) > 0;
  };
};

// SMS Settings
export interface SmsSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  api_key: string;
  default_payment_method_id: string | null;
  category_mappings: { keyword: string; category: string }[];
  created_at: string;
  updated_at: string;
}

export const useSmsSettings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sms_settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as SmsSettings | null;
    },
    enabled: !!user,
  });
};

export const useUpsertSmsSettings = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (settings: Partial<SmsSettings>) => {
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("sms_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("sms_settings")
          .update(settings as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sms_settings")
          .insert([{ user_id: user.id, ...settings } as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms_settings"] });
    },
  });
};

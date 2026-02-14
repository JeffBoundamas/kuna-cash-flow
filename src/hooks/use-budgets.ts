import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Budget } from "@/lib/types";

export const useBudgets = (month: number, year: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["budgets", user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .eq("year", year);
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
    enabled: !!user,
  });
};

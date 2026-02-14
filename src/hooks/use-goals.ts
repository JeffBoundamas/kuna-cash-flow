import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Goal } from "@/lib/types";

export const useGoals = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("is_emergency_fund", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
    enabled: !!user,
  });
};

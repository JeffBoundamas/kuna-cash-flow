import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMonthlySavings = () => {
  const { user } = useAuth();
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  return useQuery({
    queryKey: ["monthly-savings", user?.id, startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_contributions")
        .select("amount")
        .gte("created_at", `${startOfMonth}T00:00:00`);
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
    },
    enabled: !!user,
  });
};

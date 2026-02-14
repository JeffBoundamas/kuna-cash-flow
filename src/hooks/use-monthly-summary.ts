import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MonthlySummary {
  month: number;
  year: number;
  label: string;
  income: number;
  expenses: number;
}

export const useMonthlySummary = (months = 6) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monthly-summary", user?.id, months],
    queryFn: async () => {
      const now = new Date();
      const results: MonthlySummary[] = [];

      // Calculate start date (months ago)
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const { data, error } = await supabase
        .from("transactions")
        .select("amount, date")
        .gte("date", startDate.toISOString().slice(0, 10))
        .lt("date", endDate.toISOString().slice(0, 10));

      if (error) throw error;

      const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

      for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const prefix = `${y}-${String(m).padStart(2, "0")}`;

        const monthTx = (data ?? []).filter((t) => t.date.startsWith(prefix));
        const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const expenses = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

        results.push({ month: m, year: y, label: monthLabels[m - 1], income, expenses });
      }

      return results;
    },
    enabled: !!user,
  });
};

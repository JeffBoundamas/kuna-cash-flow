import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateRecurring } from "@/hooks/use-recurring-transactions";
import { usePaymentMethodsWithBalance } from "@/hooks/use-payment-methods-with-balance";
import { useCategories } from "@/hooks/use-categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatXAF } from "@/lib/currency";

const REMINDER_KEY = "daily_reminder_last";
const OBLIGATION_GEN_KEY = "obligation_gen_last";

const REQUIRED_CATEGORIES = [
  { name: "Mobile Money", type: "Expense" as const, nature: "Essential" as const, color: "amber" },
  { name: "Divers", type: "Expense" as const, nature: "Desire" as const, color: "gray" },
];

/**
 * Hook that runs on mount to:
 * 1. Auto-generate due recurring transactions
 * 2. Show daily reminder toast at 8PM if not already shown today
 * 3. Check payment method balance thresholds
 * 4. Seed missing default categories
 */
export const useAppBootstrap = () => {
  const queryClient = useQueryClient();
  const generateRecurring = useGenerateRecurring();
  const { data: methods } = usePaymentMethodsWithBalance();
  const { data: categories } = useCategories();
  const hasRun = useRef(false);
  const thresholdChecked = useRef(false);
  const categoriesSeeded = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // 1. Generate due recurring transactions
    generateRecurring.mutate();

    // 2. Daily reminder
    const now = new Date();
    const hour = now.getHours();
    const todayKey = now.toISOString().split("T")[0];
    const lastReminder = localStorage.getItem(REMINDER_KEY);

    if (hour >= 20 && lastReminder !== todayKey) {
      localStorage.setItem(REMINDER_KEY, todayKey);
      setTimeout(() => {
        toast({
          title: "📝 Rappel du soir",
          description: "Avez-vous enregistré vos dépenses aujourd'hui ?",
        });
      }, 2000);
    }

    // 3. Auto-generate obligations from fixed charges + savings goals (once per day)
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastGen = localStorage.getItem(OBLIGATION_GEN_KEY);
    if (lastGen !== monthKey) {
      localStorage.setItem(OBLIGATION_GEN_KEY, monthKey);
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-obligations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      ).then(() => {
        queryClient.invalidateQueries({ queryKey: ["obligations"] });
      }).catch(() => {});
    }
  }, []);

  // 3. Check balance warnings
  useEffect(() => {
    if (!methods || thresholdChecked.current) return;
    thresholdChecked.current = true;

    for (const pm of methods) {
      if (!pm.allow_negative_balance && pm.currentBalance < 0) {
        toast({
          title: `⚠️ Solde négatif — ${pm.name}`,
          description: `Le solde de ${pm.name} est de ${formatXAF(pm.currentBalance)}`,
          variant: "destructive",
        });
      }
    }
  }, [methods]);

  // 4. Seed missing default categories
  useEffect(() => {
    if (!categories || categoriesSeeded.current) return;
    categoriesSeeded.current = true;

    const seedMissing = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const missing = REQUIRED_CATEGORIES.filter(
        (req) => !categories.some((c) => c.name.toLowerCase() === req.name.toLowerCase() && c.type === req.type)
      );

      if (missing.length === 0) return;

      const { error } = await supabase.from("categories").insert(
        missing.map((m) => ({ user_id: user.id, name: m.name, type: m.type, nature: m.nature, color: m.color }))
      );

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      }
    };

    seedMissing();
  }, [categories]);
};

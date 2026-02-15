import { useEffect, useRef } from "react";
import { useGenerateRecurring } from "@/hooks/use-recurring-transactions";
import { usePaymentMethodsWithBalance } from "@/hooks/use-payment-methods-with-balance";
import { toast } from "@/hooks/use-toast";
import { formatXAF } from "@/lib/currency";

const REMINDER_KEY = "daily_reminder_last";

/**
 * Hook that runs on mount to:
 * 1. Auto-generate due recurring transactions
 * 2. Show daily reminder toast at 8PM if not already shown today
 * 3. Check payment method balance thresholds
 */
export const useAppBootstrap = () => {
  const generateRecurring = useGenerateRecurring();
  const { data: methods } = usePaymentMethodsWithBalance();
  const hasRun = useRef(false);
  const thresholdChecked = useRef(false);

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
};

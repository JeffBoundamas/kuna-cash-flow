import { useMemo } from "react";
import { usePaymentMethods, useActivePaymentMethods } from "@/hooks/use-payment-methods";
import { useAllTransactions } from "@/hooks/use-transactions";
import type { PaymentMethod } from "@/lib/payment-method-types";

export type PaymentMethodWithBalance = PaymentMethod & { currentBalance: number };

/**
 * Computes current balance for each payment method:
 * initial_balance + sum(transactions where payment_method_id = pm.id)
 * Falls back to account_id match for legacy transactions
 */
export const usePaymentMethodsWithBalance = () => {
  const { data: methods = [], isLoading: loadingPM, ...rest } = usePaymentMethods();
  const { data: transactions = [], isLoading: loadingTx } = useAllTransactions();

  const data = useMemo<PaymentMethodWithBalance[]>(() => {
    return methods.map((pm) => {
      const txSum = transactions
        .filter((tx) => tx.payment_method_id === pm.id || (!tx.payment_method_id && tx.account_id === pm.id))
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { ...pm, currentBalance: pm.initial_balance + txSum };
    });
  }, [methods, transactions]);

  return { data, isLoading: loadingPM || loadingTx, ...rest };
};

export const useActivePaymentMethodsWithBalance = () => {
  const { data = [], ...rest } = usePaymentMethodsWithBalance();
  return { data: data.filter((pm) => pm.is_active).sort((a, b) => a.sort_order - b.sort_order), ...rest };
};

/**
 * Check if a transaction can proceed given balance constraints.
 * Returns null if OK, or an error message string if blocked.
 */
export const checkBalanceSufficiency = (
  pm: PaymentMethodWithBalance,
  amount: number
): string | null => {
  // Only check outgoing (negative) amounts
  if (amount >= 0) return null;
  if (pm.allow_negative_balance) return null;

  const newBalance = pm.currentBalance + amount; // amount is negative
  if (newBalance < 0) {
    return `Solde insuffisant sur ${pm.name}. Solde actuel : ${pm.currentBalance} FCFA. Montant requis : ${Math.abs(amount)} FCFA.`;
  }
  return null;
};

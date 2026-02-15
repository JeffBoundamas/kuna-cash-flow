/**
 * Balance validation utilities for payment methods / accounts
 */
import { supabase } from "@/integrations/supabase/client";

export interface BalanceCheckResult {
  allowed: boolean;
  currentBalance: number;
  accountName: string;
  requestedAmount: number;
}

/**
 * Check if an account can be debited for the given amount.
 * Uses the accounts table balance (source of truth for accounts).
 */
export async function canDebitAccount(
  accountId: string,
  amount: number
): Promise<BalanceCheckResult> {
  // Fetch account
  const { data: account, error } = await supabase
    .from("accounts")
    .select("id, name, balance, balance_threshold")
    .eq("id", accountId)
    .maybeSingle();

  if (error || !account) {
    return { allowed: false, currentBalance: 0, accountName: "Inconnu", requestedAmount: amount };
  }

  // Try to find a matching payment method by name to check allow_negative_balance
  const { data: pm } = await supabase
    .from("payment_methods")
    .select("allow_negative_balance")
    .eq("name", account.name)
    .maybeSingle();

  const allowNegative = pm?.allow_negative_balance ?? false;

  if (allowNegative) {
    return { allowed: true, currentBalance: account.balance, accountName: account.name, requestedAmount: amount };
  }

  const allowed = account.balance >= amount;
  return {
    allowed,
    currentBalance: account.balance,
    accountName: account.name,
    requestedAmount: amount,
  };
}

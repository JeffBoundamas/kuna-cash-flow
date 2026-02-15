/**
 * Currency formatting utilities for FCFA/XAF
 */

export const formatXAF = (amount: number): string => {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} FCFA`;
};

export const formatXAFShort = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(".0", "")}M FCFA`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K FCFA`;
  }
  return `${amount} FCFA`;
};

export const parseAmount = (value: string): number => {
  return parseInt(value.replace(/\s/g, "").replace(/[^\d-]/g, ""), 10) || 0;
};

// Attempt to parse a Mobile Money SMS
export const parseMoMoSMS = (text: string): { amount: number; reference: string } | null => {
  const amountMatch = text.match(/(\d[\d\s.]*)\s*(?:FCFA|XAF)/i);
  const refMatch = text.match(/(?:Ref|TxnId|ID)[:\s]*([A-Z0-9]+)/i);
  
  if (amountMatch) {
    const amount = parseInt(amountMatch[1].replace(/[\s.]/g, ""), 10);
    const reference = refMatch ? refMatch[1] : "";
    return { amount, reference };
  }
  return null;
};

// Calculate "Reste à vivre" (daily spending allowance)
export const calculateResteAVivre = (
  monthlyIncome: number,
  totalExpenses: number,
  dayOfMonth: number
): number => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - dayOfMonth + 1;
  const remaining = monthlyIncome - totalExpenses;
  return Math.max(0, Math.round(remaining / remainingDays));
};

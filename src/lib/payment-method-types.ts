export type PaymentMethodType = "cash" | "bank_account" | "mobile_money" | "credit_card" | "check";

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  method_type: PaymentMethodType;
  icon: string;
  color: string;
  allow_negative_balance: boolean;
  initial_balance: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // legacy
  category: string;
}

export const METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  cash: "Espèces",
  bank_account: "Compte bancaire",
  mobile_money: "Mobile Money",
  credit_card: "Carte bancaire",
  check: "Chèque",
};

export const METHOD_TYPE_DEFAULTS: Record<PaymentMethodType, { allowNegative: boolean }> = {
  cash: { allowNegative: false },
  bank_account: { allowNegative: true },
  mobile_money: { allowNegative: false },
  credit_card: { allowNegative: true },
  check: { allowNegative: true },
};

export const ICON_OPTIONS = [
  "Banknote", "Building2", "Smartphone", "CreditCard", "FileText",
  "Wallet", "Landmark", "PiggyBank", "CircleDollarSign", "Receipt",
  "BadgeDollarSign", "HandCoins", "Coins", "ArrowLeftRight", "ShieldCheck",
];

export const COLOR_OPTIONS = [
  "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#64748B",
];

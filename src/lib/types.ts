export type TransactionStatus = "Planned" | "Realized";
export type CategoryType = "Income" | "Expense";
export type CategoryNature = "Essential" | "Desire" | "Savings";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  nature: CategoryNature;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string;
  amount: number;
  label: string;
  status: TransactionStatus;
  date: string;
  sms_reference: string | null;
  payment_method_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  icon: string;
  is_emergency_fund: boolean;
  auto_contribute: boolean;
  monthly_contribution: number;
  contribute_day: number;
  preferred_payment_method_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  payment_method_id: string | null;
  category_id: string;
  amount: number;
  label: string;
  frequency: "daily" | "weekly" | "monthly";
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

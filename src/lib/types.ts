export type AccountType = "Bank" | "Mobile Money" | "Cash" | "Tontine";
export type TransactionStatus = "Planned" | "Realized";
export type CategoryType = "Income" | "Expense";
export type CategoryNature = "Essential" | "Desire" | "Savings";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  created_at: string;
  updated_at: string;
}

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
  account_id: string;
  category_id: string;
  amount: number;
  label: string;
  status: TransactionStatus;
  date: string;
  sms_reference: string | null;
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
  created_at: string;
  updated_at: string;
}

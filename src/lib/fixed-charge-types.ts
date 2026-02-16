export type FixedChargeFrequency = "monthly" | "quarterly" | "yearly";

export interface FixedCharge {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: FixedChargeFrequency;
  due_day: number;
  category_id: string | null;
  payment_method_id: string | null;
  beneficiary: string;
  is_active: boolean;
  auto_generate_obligation: boolean;
  reminder_days_before: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const frequencyLabels: Record<FixedChargeFrequency, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  yearly: "Annuel",
};

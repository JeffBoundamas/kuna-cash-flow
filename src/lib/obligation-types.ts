export type ObligationType = "creance" | "engagement";
export type ObligationConfidence = "certain" | "probable" | "uncertain";
export type ObligationStatus = "active" | "partially_paid" | "settled" | "cancelled";

export interface Obligation {
  id: string;
  user_id: string;
  type: ObligationType;
  person_name: string;
  description: string | null;
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  confidence: ObligationConfidence;
  status: ObligationStatus;
  linked_tontine_id: string | null;
  linked_fixed_charge_id: string | null;
  linked_savings_goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObligationPayment {
  id: string;
  obligation_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  account_id: string | null;
  payment_method_id: string | null;
  notes: string | null;
  created_at: string;
}

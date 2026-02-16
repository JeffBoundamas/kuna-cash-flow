export type TontineFrequency = "weekly" | "monthly";
export type TontineStatus = "active" | "completed";
export type TontinePaymentType = "contribution" | "pot_received";

export interface Tontine {
  id: string;
  user_id: string;
  name: string;
  total_members: number;
  contribution_amount: number;
  frequency: TontineFrequency;
  start_date: string;
  current_cycle: number;
  status: TontineStatus;
  created_at: string;
  updated_at: string;
}

export interface TontineMember {
  id: string;
  tontine_id: string;
  user_id: string;
  member_name: string;
  position_in_order: number;
  is_current_user: boolean;
  has_received_pot: boolean;
  payout_date: string | null;
  phone_number: string | null;
  created_at: string;
}

export interface TontinePayment {
  id: string;
  tontine_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  cycle_number: number;
  type: TontinePaymentType;
  linked_account_id: string | null;
  created_at: string;
}

/** Calcule la prochaine date de cotisation */
export function getNextContributionDate(startDate: string, frequency: TontineFrequency, currentCycle: number): Date {
  const start = new Date(startDate);
  if (frequency === "monthly") {
    const next = new Date(start);
    next.setMonth(next.getMonth() + currentCycle - 1);
    return next;
  }
  // weekly
  const next = new Date(start);
  next.setDate(next.getDate() + (currentCycle - 1) * 7);
  return next;
}

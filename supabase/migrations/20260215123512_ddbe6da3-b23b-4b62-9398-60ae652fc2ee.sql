
-- Add payment_method_id to transactions (nullable for backward compat)
ALTER TABLE public.transactions
ADD COLUMN payment_method_id uuid REFERENCES public.payment_methods(id);

-- Add payment_method_id to tontine_payments
ALTER TABLE public.tontine_payments
ADD COLUMN payment_method_id uuid REFERENCES public.payment_methods(id);

-- Add payment_method_id to obligation_payments
ALTER TABLE public.obligation_payments
ADD COLUMN payment_method_id uuid REFERENCES public.payment_methods(id);

-- Add payment_method_id to goal_contributions
ALTER TABLE public.goal_contributions
ADD COLUMN payment_method_id uuid REFERENCES public.payment_methods(id);

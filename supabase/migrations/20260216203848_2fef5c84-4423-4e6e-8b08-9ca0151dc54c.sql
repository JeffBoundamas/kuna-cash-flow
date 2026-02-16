
-- Create fixed_charges_frequency enum
CREATE TYPE public.fixed_charge_frequency AS ENUM ('monthly', 'quarterly', 'yearly');

-- Create fixed_charges table
CREATE TABLE public.fixed_charges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount bigint NOT NULL,
  frequency fixed_charge_frequency NOT NULL DEFAULT 'monthly',
  due_day integer NOT NULL DEFAULT 1 CHECK (due_day >= 1 AND due_day <= 31),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  beneficiary text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  auto_generate_obligation boolean NOT NULL DEFAULT true,
  reminder_days_before integer NOT NULL DEFAULT 3,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add new FK columns to obligations
ALTER TABLE public.obligations
  ADD COLUMN linked_fixed_charge_id uuid REFERENCES public.fixed_charges(id) ON DELETE SET NULL,
  ADD COLUMN linked_savings_goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

-- Add savings goal planning columns to goals
ALTER TABLE public.goals
  ADD COLUMN auto_contribute boolean NOT NULL DEFAULT false,
  ADD COLUMN monthly_contribution bigint NOT NULL DEFAULT 0,
  ADD COLUMN contribute_day integer NOT NULL DEFAULT 1,
  ADD COLUMN preferred_payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- Enable RLS on fixed_charges
ALTER TABLE public.fixed_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fixed charges"
  ON public.fixed_charges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fixed charges"
  ON public.fixed_charges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fixed charges"
  ON public.fixed_charges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fixed charges"
  ON public.fixed_charges FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_fixed_charges_updated_at
  BEFORE UPDATE ON public.fixed_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for fixed_charges
ALTER PUBLICATION supabase_realtime ADD TABLE public.fixed_charges;

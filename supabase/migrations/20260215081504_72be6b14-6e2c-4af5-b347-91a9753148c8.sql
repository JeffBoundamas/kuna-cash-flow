
-- Create enums for tontine
CREATE TYPE public.tontine_frequency AS ENUM ('weekly', 'monthly');
CREATE TYPE public.tontine_status AS ENUM ('active', 'completed');
CREATE TYPE public.tontine_payment_type AS ENUM ('contribution', 'pot_received');

-- Tontines table
CREATE TABLE public.tontines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_members INTEGER NOT NULL DEFAULT 2,
  contribution_amount BIGINT NOT NULL DEFAULT 0,
  frequency tontine_frequency NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_cycle INTEGER NOT NULL DEFAULT 1,
  status tontine_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tontines" ON public.tontines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tontines" ON public.tontines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tontines" ON public.tontines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tontines" ON public.tontines FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tontines_updated_at BEFORE UPDATE ON public.tontines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tontine members table
CREATE TABLE public.tontine_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  position_in_order INTEGER NOT NULL DEFAULT 1,
  is_current_user BOOLEAN NOT NULL DEFAULT false,
  has_received_pot BOOLEAN NOT NULL DEFAULT false,
  payout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tontine_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tontine members" ON public.tontine_members FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tontine members" ON public.tontine_members FOR INSERT 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tontine members" ON public.tontine_members FOR UPDATE 
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own tontine members" ON public.tontine_members FOR DELETE 
  USING (user_id = auth.uid());

-- Tontine payments table
CREATE TABLE public.tontine_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  type tontine_payment_type NOT NULL DEFAULT 'contribution',
  linked_account_id UUID REFERENCES public.accounts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tontine_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tontine payments" ON public.tontine_payments FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tontine payments" ON public.tontine_payments FOR INSERT 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own tontine payments" ON public.tontine_payments FOR DELETE 
  USING (user_id = auth.uid());


-- Create enums for obligations
CREATE TYPE public.obligation_type AS ENUM ('creance', 'engagement');
CREATE TYPE public.obligation_confidence AS ENUM ('certain', 'probable', 'uncertain');
CREATE TYPE public.obligation_status AS ENUM ('active', 'partially_paid', 'settled', 'cancelled');

-- Create obligations table
CREATE TABLE public.obligations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type obligation_type NOT NULL,
  person_name TEXT NOT NULL,
  description TEXT,
  total_amount BIGINT NOT NULL,
  remaining_amount BIGINT NOT NULL,
  due_date DATE,
  confidence obligation_confidence NOT NULL DEFAULT 'certain',
  status obligation_status NOT NULL DEFAULT 'active',
  linked_tontine_id UUID REFERENCES public.tontines(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create obligation_payments table
CREATE TABLE public.obligation_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID REFERENCES public.accounts(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for obligations
CREATE POLICY "Users can view own obligations" ON public.obligations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own obligations" ON public.obligations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own obligations" ON public.obligations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own obligations" ON public.obligations FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for obligation_payments
CREATE POLICY "Users can view own obligation payments" ON public.obligation_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own obligation payments" ON public.obligation_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own obligation payments" ON public.obligation_payments FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on obligations
CREATE TRIGGER update_obligations_updated_at
  BEFORE UPDATE ON public.obligations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

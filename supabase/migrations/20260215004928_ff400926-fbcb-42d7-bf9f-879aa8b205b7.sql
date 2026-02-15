
-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN phone text;

-- Create recurring_transactions table
CREATE TABLE public.recurring_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  label text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT 'monthly',
  next_due_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own recurring transactions"
  ON public.recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON public.recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON public.recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON public.recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

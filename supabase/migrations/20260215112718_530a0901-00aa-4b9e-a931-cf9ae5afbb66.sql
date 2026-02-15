
-- Table for user-defined payment methods under each account category
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '💳',
  category account_type NOT NULL DEFAULT 'Bank',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Seed default payment methods for new users
CREATE OR REPLACE FUNCTION public.seed_default_payment_methods()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.payment_methods (user_id, name, icon, category) VALUES
    (NEW.id, 'Compte courant', '🏦', 'Bank'),
    (NEW.id, 'Visa', '💳', 'Bank'),
    (NEW.id, 'Épargne', '🏛️', 'Bank'),
    (NEW.id, 'Orange Money', '📱', 'Mobile Money'),
    (NEW.id, 'MTN MoMo', '📱', 'Mobile Money'),
    (NEW.id, 'Cash', '💵', 'Cash'),
    (NEW.id, 'Tontine', '🤝', 'Tontine');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_payment_methods
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_payment_methods();

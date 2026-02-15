
-- Add new columns to payment_methods
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS allow_negative_balance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS initial_balance bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Update existing seed data with proper colors and settings
-- We'll update the seed function to include the new columns
CREATE OR REPLACE FUNCTION public.seed_default_payment_methods()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.payment_methods (user_id, name, icon, category, color, allow_negative_balance, initial_balance, sort_order) VALUES
    (NEW.id, 'Espèces', 'Banknote', 'Cash', '#22C55E', false, 0, 1),
    (NEW.id, 'Compte bancaire', 'Building2', 'Bank', '#3B82F6', true, 0, 2),
    (NEW.id, 'Mobile Money', 'Smartphone', 'Mobile Money', '#F59E0B', false, 0, 3);
  RETURN NEW;
END;
$function$;

-- Add updated_at trigger
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Create new payment method type enum
CREATE TYPE public.payment_method_type AS ENUM ('cash', 'bank_account', 'mobile_money', 'credit_card', 'check');

-- Add method_type column to existing payment_methods table
ALTER TABLE public.payment_methods ADD COLUMN method_type public.payment_method_type NOT NULL DEFAULT 'cash';

-- Update existing rows based on category
UPDATE public.payment_methods SET method_type = 
  CASE 
    WHEN category = 'Cash' THEN 'cash'::payment_method_type
    WHEN category = 'Bank' THEN 'bank_account'::payment_method_type
    WHEN category = 'Mobile Money' THEN 'mobile_money'::payment_method_type
    ELSE 'cash'::payment_method_type
  END;

-- Update seed function to include method_type
CREATE OR REPLACE FUNCTION public.seed_default_payment_methods()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.payment_methods (user_id, name, icon, category, color, allow_negative_balance, initial_balance, sort_order, method_type) VALUES
    (NEW.id, 'Espèces', 'Banknote', 'Cash', '#22C55E', false, 0, 1, 'cash'),
    (NEW.id, 'Compte bancaire', 'Building2', 'Bank', '#3B82F6', true, 0, 2, 'bank_account'),
    (NEW.id, 'Mobile Money', 'Smartphone', 'Mobile Money', '#F59E0B', false, 0, 3, 'mobile_money');
  RETURN NEW;
END;
$function$;

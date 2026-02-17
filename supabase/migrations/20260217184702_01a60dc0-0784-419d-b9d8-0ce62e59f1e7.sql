
-- Step 1a: Migrate accounts that don't have matching payment_methods
INSERT INTO public.payment_methods (user_id, name, method_type, initial_balance, icon, color, allow_negative_balance, is_active, sort_order, category)
SELECT 
  a.user_id,
  a.name,
  CASE a.type
    WHEN 'Bank' THEN 'bank_account'::payment_method_type
    WHEN 'Mobile Money' THEN 'mobile_money'::payment_method_type
    WHEN 'Cash' THEN 'cash'::payment_method_type
    WHEN 'Tontine' THEN 'cash'::payment_method_type
  END,
  a.balance,
  COALESCE(NULLIF(a.icon, ''), 'Wallet'),
  '#3B82F6',
  (a.type = 'Bank'),
  true,
  COALESCE((SELECT MAX(pm.sort_order) FROM public.payment_methods pm WHERE pm.user_id = a.user_id), 0) + ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.created_at),
  a.type
FROM public.accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm WHERE pm.user_id = a.user_id AND pm.name = a.name
);

-- Step 1b: Update transactions with null payment_method_id to match account_id
UPDATE public.transactions t
SET payment_method_id = t.account_id
WHERE t.payment_method_id IS NULL 
  AND t.account_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.payment_methods pm WHERE pm.id = t.account_id);

-- Step 1c: Make account_id columns nullable
ALTER TABLE public.transactions ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE public.recurring_transactions ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE public.goal_contributions ALTER COLUMN account_id DROP NOT NULL;

-- Step 1d: Add payment_method_id to recurring_transactions if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'recurring_transactions' AND column_name = 'payment_method_id'
  ) THEN
    ALTER TABLE public.recurring_transactions ADD COLUMN payment_method_id uuid REFERENCES public.payment_methods(id);
  END IF;
END $$;

-- Backfill recurring_transactions.payment_method_id from account_id
UPDATE public.recurring_transactions rt
SET payment_method_id = rt.account_id
WHERE rt.payment_method_id IS NULL 
  AND rt.account_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.payment_methods pm WHERE pm.id = rt.account_id);


-- Create enums for SMS import types and statuses
CREATE TYPE public.sms_parsed_type AS ENUM (
  'transfer_out', 'transfer_in', 'bundle', 'merchant_payment', 'bill_payment'
);

CREATE TYPE public.sms_import_status AS ENUM (
  'pending_review', 'confirmed', 'rejected', 'duplicate'
);

-- Create sms_imports table
CREATE TABLE public.sms_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  raw_text text NOT NULL,
  transaction_id text NOT NULL,
  parsed_type public.sms_parsed_type NOT NULL,
  parsed_amount integer NOT NULL DEFAULT 0,
  parsed_fees integer NOT NULL DEFAULT 0,
  parsed_balance numeric,
  parsed_recipient text,
  parsed_reference text,
  status public.sms_import_status NOT NULL DEFAULT 'pending_review',
  linked_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create unique index on user_id + transaction_id to prevent duplicates per user
CREATE UNIQUE INDEX idx_sms_imports_user_tid ON public.sms_imports (user_id, transaction_id);

-- Enable RLS
ALTER TABLE public.sms_imports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own sms imports"
  ON public.sms_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sms imports"
  ON public.sms_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sms imports"
  ON public.sms_imports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sms imports"
  ON public.sms_imports FOR DELETE
  USING (auth.uid() = user_id);

-- SMS settings table for webhook API key and preferences
CREATE TABLE public.sms_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  api_key uuid NOT NULL DEFAULT gen_random_uuid(),
  default_payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  category_mappings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sms settings"
  ON public.sms_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sms settings"
  ON public.sms_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sms settings"
  ON public.sms_settings FOR UPDATE
  USING (auth.uid() = user_id);

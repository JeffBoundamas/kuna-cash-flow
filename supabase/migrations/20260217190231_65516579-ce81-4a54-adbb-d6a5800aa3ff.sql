
-- Add onboarding_done flag to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;

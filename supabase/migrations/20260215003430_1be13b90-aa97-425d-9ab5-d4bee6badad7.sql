
-- Create goal_contributions table
CREATE TABLE public.goal_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own contributions"
ON public.goal_contributions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contributions"
ON public.goal_contributions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contributions"
ON public.goal_contributions FOR DELETE
USING (auth.uid() = user_id);

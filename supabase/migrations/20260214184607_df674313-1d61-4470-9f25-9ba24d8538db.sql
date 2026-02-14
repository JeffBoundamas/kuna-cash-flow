
-- Add color column
ALTER TABLE public.categories ADD COLUMN color text NOT NULL DEFAULT 'blue';

-- Map existing categories to colors based on nature
UPDATE public.categories SET color = 'blue' WHERE nature = 'Essential';
UPDATE public.categories SET color = 'amber' WHERE nature = 'Desire';
UPDATE public.categories SET color = 'emerald' WHERE nature = 'Savings';

-- Update seed function to include colors
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.categories (user_id, name, type, nature, color) VALUES
    (NEW.id, 'Salaire', 'Income', 'Essential', 'blue'),
    (NEW.id, 'Freelance', 'Income', 'Essential', 'indigo'),
    (NEW.id, 'Loyer', 'Expense', 'Essential', 'blue'),
    (NEW.id, 'Alimentation', 'Expense', 'Essential', 'emerald'),
    (NEW.id, 'Transport', 'Expense', 'Essential', 'indigo'),
    (NEW.id, 'Électricité', 'Expense', 'Essential', 'yellow'),
    (NEW.id, 'Restaurant', 'Expense', 'Desire', 'amber'),
    (NEW.id, 'Loisirs', 'Expense', 'Desire', 'rose'),
    (NEW.id, 'Shopping', 'Expense', 'Desire', 'violet'),
    (NEW.id, 'Épargne', 'Expense', 'Savings', 'emerald'),
    (NEW.id, 'Investissement', 'Expense', 'Savings', 'green'),
    (NEW.id, 'Charge Familiale', 'Expense', 'Desire', 'orange'),
    (NEW.id, 'Santé', 'Expense', 'Essential', 'red'),
    (NEW.id, 'Éducation', 'Expense', 'Essential', 'violet');
  RETURN NEW;
END;
$function$;

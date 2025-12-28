ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS use_automatic_level_calculation BOOLEAN DEFAULT FALSE;

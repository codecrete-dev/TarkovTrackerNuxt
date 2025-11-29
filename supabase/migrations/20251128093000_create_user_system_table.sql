-- Ensure user_system table exists for user-level system state (team linkage, future settings)
CREATE TABLE IF NOT EXISTS public.user_system (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful index for reverse lookups by team
CREATE INDEX IF NOT EXISTS idx_user_system_team_id ON public.user_system(team_id);

-- Enable Row Level Security
ALTER TABLE public.user_system ENABLE ROW LEVEL SECURITY;

-- RLS policies (idempotent guards to avoid duplicate errors on re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_system' AND policyname = 'Users can view own system row'
  ) THEN
    CREATE POLICY "Users can view own system row" ON public.user_system
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_system' AND policyname = 'Users can upsert own system row'
  ) THEN
    CREATE POLICY "Users can upsert own system row" ON public.user_system
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_system' AND policyname = 'Users can update own system row'
  ) THEN
    CREATE POLICY "Users can update own system row" ON public.user_system
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_system' AND policyname = 'Users can delete own system row'
  ) THEN
    CREATE POLICY "Users can delete own system row" ON public.user_system
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

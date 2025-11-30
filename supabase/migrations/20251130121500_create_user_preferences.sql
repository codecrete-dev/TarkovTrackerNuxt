-- Create user_preferences table for syncing client preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streamer_mode BOOLEAN DEFAULT FALSE,
  team_hide JSONB DEFAULT '{}'::jsonb,
  task_team_hide_all BOOLEAN DEFAULT FALSE,
  items_team_hide_all BOOLEAN DEFAULT FALSE,
  items_team_hide_non_fir BOOLEAN DEFAULT FALSE,
  items_team_hide_hideout BOOLEAN DEFAULT FALSE,
  map_team_hide_all BOOLEAN DEFAULT FALSE,
  task_primary_view TEXT,
  task_map_view TEXT,
  task_trader_view TEXT,
  task_secondary_view TEXT,
  task_user_view TEXT,
  needed_type_view TEXT,
  items_hide_non_fir BOOLEAN DEFAULT FALSE,
  hide_global_tasks BOOLEAN DEFAULT FALSE,
  hide_non_kappa_tasks BOOLEAN DEFAULT FALSE,
  neededitems_style TEXT,
  hideout_primary_view TEXT,
  locale_override TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: only owner can view/insert/update/delete
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Optional updated_at trigger for automatic timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

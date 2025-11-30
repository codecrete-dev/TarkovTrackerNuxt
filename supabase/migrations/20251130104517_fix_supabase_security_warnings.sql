-- Address Supabase security warnings
-- - Set an explicit search_path on handle_new_user to avoid role-mutable search_path
-- - Recreate RLS policies to avoid per-row auth.<function>() re-evaluation by wrapping in (select ...)

-- Ensure handle_new_user functions run with a fixed search_path
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT p.proname, oidvectortypes(p.proargtypes) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'handle_new_user'
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = public',
      rec.proname,
      rec.args
    );
  END LOOP;
END $$;

-- Optimize RLS policies on user_progress
DO $$
BEGIN
  IF to_regclass('public.user_progress') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress';
    EXECUTE 'CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING ((select auth.uid()) = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress';
    EXECUTE 'CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING ((select auth.uid()) = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress';
    EXECUTE 'CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK ((select auth.uid()) = user_id)';
  END IF;
END $$;

-- Optimize RLS policies on teams
DO $$
BEGIN
  IF to_regclass('public.teams') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Team owners can update team" ON public.teams';
    EXECUTE 'DROP POLICY IF EXISTS "Owners can update their teams" ON public.teams';
    EXECUTE 'CREATE POLICY "Owners can update their teams" ON public.teams FOR UPDATE USING ((select auth.uid()) = owner_id)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can create teams" ON public.teams';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert teams" ON public.teams';
    EXECUTE 'CREATE POLICY "Users can insert teams" ON public.teams FOR INSERT WITH CHECK ((select auth.uid()) = owner_id)';
  END IF;
END $$;

-- Optimize RLS policies on user_system
DO $$
BEGIN
  IF to_regclass('public.user_system') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own system data" ON public.user_system';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own system row" ON public.user_system';
    EXECUTE 'CREATE POLICY "Users can view own system row" ON public.user_system FOR SELECT USING ((select auth.uid()) = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can upsert own system row" ON public.user_system';
    EXECUTE 'CREATE POLICY "Users can upsert own system row" ON public.user_system FOR INSERT WITH CHECK ((select auth.uid()) = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can update own system row" ON public.user_system';
    EXECUTE 'CREATE POLICY "Users can update own system row" ON public.user_system FOR UPDATE USING ((select auth.uid()) = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own system row" ON public.user_system';
    EXECUTE 'CREATE POLICY "Users can delete own system row" ON public.user_system FOR DELETE USING ((select auth.uid()) = user_id)';
  END IF;
END $$;

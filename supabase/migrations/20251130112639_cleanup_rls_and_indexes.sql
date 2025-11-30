-- Cleanup legacy RLS policies and duplicate indexes flagged by Supabase lint

-- Drop duplicate/legacy indexes
DROP INDEX IF EXISTS public.team_events_team_id_idx;
DROP INDEX IF EXISTS public.teams_join_code_unique_idx;

-- Recreate consolidated RLS policies with (select auth.uid()) to avoid per-row re-evaluation

-- api_tokens
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.api_tokens') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='api_tokens' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.api_tokens', pol.policyname);
    END LOOP;

    CREATE POLICY "Users can view own API tokens" ON public.api_tokens
      FOR SELECT USING ((select auth.uid()) = user_id);

    CREATE POLICY "Users can create own API tokens" ON public.api_tokens
      FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

    CREATE POLICY "Users can update own API tokens" ON public.api_tokens
      FOR UPDATE USING ((select auth.uid()) = user_id);

    CREATE POLICY "Users can delete own API tokens" ON public.api_tokens
      FOR DELETE USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- teams
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.teams') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='teams' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', pol.policyname);
    END LOOP;

    CREATE POLICY "Users can view teams they are members of" ON public.teams
      FOR SELECT USING (
        id IN (
          SELECT team_id FROM public.team_memberships
          WHERE user_id = (select auth.uid())
        )
      );

    CREATE POLICY "Owners can update their teams" ON public.teams
      FOR UPDATE USING ((select auth.uid()) = owner_id);

    CREATE POLICY "Owners can delete their teams" ON public.teams
      FOR DELETE USING ((select auth.uid()) = owner_id);

    CREATE POLICY "Users can insert teams" ON public.teams
      FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);
  END IF;
END $$;

-- team_memberships
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.team_memberships') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='team_memberships' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_memberships', pol.policyname);
    END LOOP;

    CREATE POLICY "Users can view memberships for their teams" ON public.team_memberships
      FOR SELECT USING (
        user_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = team_id AND t.owner_id = (select auth.uid())
        )
      );

    CREATE POLICY "Users can insert themselves into teams" ON public.team_memberships
      FOR INSERT WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Team owners can update memberships" ON public.team_memberships
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = team_id AND t.owner_id = (select auth.uid())
        )
      );

    CREATE POLICY "Team owners can delete memberships" ON public.team_memberships
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = team_id AND t.owner_id = (select auth.uid())
        ) OR user_id = (select auth.uid())
      );
  END IF;
END $$;

-- team_events
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.team_events') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='team_events' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_events', pol.policyname);
    END LOOP;

    CREATE POLICY "Team members can view team events" ON public.team_events
      FOR SELECT USING (
        team_id IN (
          SELECT team_id FROM public.team_memberships
          WHERE user_id = (select auth.uid())
        )
      );

    CREATE POLICY "System or owners can create team events" ON public.team_events
      FOR INSERT WITH CHECK (
        initiated_by = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM public.team_memberships m
          WHERE m.team_id = public.team_events.team_id
            AND m.user_id = (select auth.uid())
            AND m.role = 'owner'
        )
      );
  END IF;
END $$;

-- user_system
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.user_system') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_system' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_system', pol.policyname);
    END LOOP;

    CREATE POLICY "Users can view own system row" ON public.user_system
      FOR SELECT USING ((select auth.uid()) = user_id);

    CREATE POLICY "Users can upsert own system row" ON public.user_system
      FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

    CREATE POLICY "Users can update own system row" ON public.user_system
      FOR UPDATE USING ((select auth.uid()) = user_id);

    CREATE POLICY "Users can delete own system row" ON public.user_system
      FOR DELETE USING ((select auth.uid()) = user_id);
  END IF;
END $$;

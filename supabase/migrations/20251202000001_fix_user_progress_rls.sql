-- Fix user_progress RLS policies to allow team viewing
-- Drop ALL existing policies first to avoid conflicts

DO $$
BEGIN
  IF to_regclass('public.user_progress') IS NOT NULL THEN
    -- Drop all existing SELECT policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own and teammates progress" ON public.user_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for users" ON public.user_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Allow users to view own progress" ON public.user_progress';

    -- Create new policy that allows viewing own progress AND teammates' progress
    EXECUTE 'CREATE POLICY "Users can view own and teammates progress" ON public.user_progress
      FOR SELECT
      USING (
        -- Can view own progress
        auth.uid() = user_id
        OR
        -- Can view teammates'' progress (users in the same team)
        EXISTS (
          SELECT 1
          FROM team_memberships tm1
          INNER JOIN team_memberships tm2 ON tm1.team_id = tm2.team_id
          WHERE tm1.user_id = auth.uid()
            AND tm2.user_id = user_progress.user_id
        )
      )';
  END IF;
END $$;

-- Fix team_memberships SELECT policy to allow team members to see each other
-- This is required for user_progress RLS to work correctly (teammates need to see each other's progress)
-- IMPORTANT: Use user_system table to get team_id to avoid infinite recursion

DO $$
BEGIN
  IF to_regclass('public.team_memberships') IS NOT NULL THEN
    -- Drop existing SELECT policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view memberships for their teams" ON public.team_memberships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own and teammate memberships" ON public.team_memberships';
    
    -- Create new policy that allows:
    -- 1. Users to see their own membership
    -- 2. Team members to see other members in their team
    -- Uses user_system table (not team_memberships) to avoid infinite recursion
    EXECUTE '
      CREATE POLICY "Users can view own and teammate memberships" ON public.team_memberships
        FOR SELECT USING (
          -- Can see own membership
          user_id = (select auth.uid())
          OR
          -- Can see memberships in the team the current user belongs to
          -- Query user_system instead of team_memberships to avoid recursion
          team_id = (
            SELECT team_id FROM public.user_system 
            WHERE user_id = (select auth.uid())
          )
        )
    ';
  END IF;
END $$;

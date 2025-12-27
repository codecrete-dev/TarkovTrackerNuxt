-- Fix team_memberships SELECT policy to allow team members to see each other
-- This is required for user_progress RLS to work correctly (teammates need to see each other's progress)

DO $$
BEGIN
  IF to_regclass('public.team_memberships') IS NOT NULL THEN
    -- Drop existing SELECT policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view memberships for their teams" ON public.team_memberships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own and teammate memberships" ON public.team_memberships';
    
    -- Create new policy that allows:
    -- 1. Users to see their own membership
    -- 2. Team owners to see all memberships in their teams
    -- 3. Team members to see other members in their team (via their own team_id)
    EXECUTE '
      CREATE POLICY "Users can view own and teammate memberships" ON public.team_memberships
        FOR SELECT USING (
          -- Can see own membership
          user_id = (select auth.uid())
          OR
          -- Can see memberships in teams where current user is also a member
          -- Use a subquery that only references current user to avoid recursion
          team_id IN (
            SELECT team_id FROM public.team_memberships 
            WHERE user_id = (select auth.uid())
          )
        )
    ';
  END IF;
END $$;

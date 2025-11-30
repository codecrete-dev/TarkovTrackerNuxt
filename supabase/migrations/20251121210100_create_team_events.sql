-- Create team events table for audit trail and cooldown tracking
CREATE TABLE IF NOT EXISTS public.team_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  target_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_team_events_team_id ON public.team_events(team_id);
CREATE INDEX idx_team_events_type_created ON public.team_events(event_type, created_at);
CREATE INDEX idx_team_events_initiated_by ON public.team_events(initiated_by, created_at);
CREATE INDEX idx_team_events_cooldown ON public.team_events(team_id, event_type, initiated_by, created_at) 
  WHERE event_type IN ('member_kicked', 'member_left');

-- Row Level Security Policies
ALTER TABLE public.team_events ENABLE ROW LEVEL SECURITY;

-- Team members can view events for their own teams
CREATE POLICY "Team members can view team events" ON public.team_events
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Only system or team owners can create events
CREATE POLICY "System can create team events" ON public.team_events
  FOR INSERT WITH CHECK (
    -- System operations (when initiated_by matches current user)
    initiated_by = auth.uid() OR
    -- Check if user is team owner
    (
      SELECT role = 'owner' FROM public.team_memberships 
      WHERE team_id = public.team_events.team_id 
      AND user_id = auth.uid()
      LIMIT 1
    )
  );

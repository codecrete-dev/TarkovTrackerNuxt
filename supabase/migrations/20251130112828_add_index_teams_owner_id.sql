-- Add covering index for teams.owner_id foreign key
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);

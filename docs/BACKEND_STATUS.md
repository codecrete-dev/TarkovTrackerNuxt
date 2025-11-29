# Backend Status
**Last Updated**: 2025-11-28
## Current Architecture
- **Auth**: Supabase (Discord, Twitch OAuth)
- **Database**: Supabase PostgreSQL
- **Edge Functions**: Supabase Functions (deployed to Cloudflare)
- **API Caching**: Cloudflare Cache API
## Completed
### State Management
- [x] Pinia stores (tarkov, user, progress)
- [x] localStorage persistence with `pinia-plugin-persistedstate`
- [x] User-scoped localStorage with userId validation
- [x] Automatic localStorage clearing on logout
- [x] Smart merge for localStorage + Supabase data
### Supabase Integration
- [x] Auth with Discord/Twitch OAuth
- [x] `useSupabaseSync` composable for user_progress
- [x] Game mode system (PvP/PvE separate tracking)
### Edge Functions Created
- [x] `progress-update` - Transaction-safe progress updates
- [x] `team-create` - Team creation with validation
- [x] `team-join` - Password validation, capacity checks
- [x] `team-leave` - Cooldown enforcement _(patched 2025-11-28 to continue when \`user_system\` table is missing instead of throwing 500)_
- [x] `team-kick` - Owner-only member removal
- [x] `token-revoke` - API token deletion
### Database Migrations
- [x] `api_tokens` table with RLS policies
- [x] `team_events` table for audit trail
- [ ] `user_system` table (new) — required for team sync; apply `supabase/migrations/20251128093000_create_user_system_table.sql` via `supabase db push`
## In Progress
### Team Features Frontend
- [ ] `app/features/team/TeamMembers.vue` - integrate edge functions
- [ ] `app/features/team/MyTeam.vue` - integrate edge functions
- [ ] `app/features/team/TeamInvite.vue` - integrate edge functions
### API Token Frontend
- [ ] `app/features/settings/ApiTokens.vue` - integrate edge functions
- [ ] `app/pages/api.vue` - integrate edge functions
- [ ] `token-create` edge function
- [ ] `token-list` edge function
## Testing Needed
- [ ] End-to-end validation with authenticated users
- [ ] Team collaboration with multiple users
- [ ] Data sync under various network conditions
- [ ] localStorage persistence for unauthenticated users
- [ ] User switching scenarios
- [ ] PvP/PvE game mode switching data integrity
## Deployment
- [ ] Configure Cloudflare Pages settings
- [ ] Deploy Supabase functions: `supabase functions deploy`
  - Pending: redeploy `team-leave` with 2025-11-28 patch
- [ ] Set production environment variables

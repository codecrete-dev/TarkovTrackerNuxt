# Team Gateway (Cloudflare Worker)

Goal: front-door the team mutations (create/join/leave/kick) to rate-limit abuse before they reach Supabase, and keep Supabase on the free tier.

## Components
- **Cloudflare Worker** `team-gateway` (`workers/team-gateway/`)
  - Proxies to Supabase Edge Functions `team-create`, `team-join`, `team-leave`, `team-kick`.
  - KV-backed rate limits per IP+user token.
  - CORS allowlist via `ALLOWED_ORIGIN`.
- **KV namespace** `team-gateway`  
  - Created via MCP: id `f3f56d4879694eee9b9de1e43db252d6`.

## Deploy (Cloudflare)
1. Ensure active account is **DysektAI** (already set in MCP).  
2. Set secrets (per env):  
   - `SUPABASE_URL=https://<project>.supabase.co`  
   - `SUPABASE_ANON_KEY=<anon-key>`  
   - `ALLOWED_ORIGIN=https://dev.tarkovtracker.org` (or prod)  
3. Bind KV: already referenced in `wrangler.toml` with id `f3f56d4879694eee9b9de1e43db252d6`.  
4. Deploy (from repo root):  
   ```sh
   cd workers/team-gateway
   npx wrangler deploy
   ```

## Routes
- `POST /team/create|join|leave|kick` (trailing slashes and double-slash host paths are normalized)
  - Headers: `Authorization: Bearer <supabase access token>`
  - Body: forwarded to Supabase Edge Function unchanged.
- `GET /health` for uptime checks.

## Operational notes (2025-11-28)
- If Supabase is missing the `user_system` table, the upstream `team-leave` function used to return 500, which surfaced as a 500 here. The function now logs and continues when that table is absent, but **the real fix is to apply migration `20251128093000_create_user_system_table.sql` and redeploy `team-leave`**.
- Gateway config/secrets unchanged; only Supabase needs the migration + function redeploy.

## Rate limits (KV buckets)
- create: 10 / hour / ip+user
- join: 30 / 10 min / ip+user
- leave: 30 / hour / ip+user
- kick: 20 / hour / ip+user

## Nuxt client wiring
- `NUXT_PUBLIC_TEAM_GATEWAY_URL=https://<worker>.workers.dev` (or custom domain)  
- `useEdgeFunctions` falls back to direct Supabase functions if the gateway URL is unset.

## Supabase (no new schema changes)
- Existing tables: `teams`, `user_system` with RLS for owners/members.  
- Edge Functions still perform the real mutations; the Worker only gates traffic.

## Observability ideas
- Add logging in Worker for `429` counts to tune limits.  
- Optionally add `__dev__` route to dump KV counters in non-prod.

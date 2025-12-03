# Team System Architecture

## Overview

Team features use a two-tier architecture:

1. **Cloudflare Worker** (`workers/team-gateway/`) - Rate limiting and abuse prevention
2. **Supabase Edge Functions** - Business logic and database mutations

## Components

### Cloudflare Worker (`team-gateway`)

- Proxies to Supabase Edge Functions: `team-create`, `team-join`, `team-leave`, `team-kick`
- KV-backed rate limits per IP+user
- KV namespace ID: `f3f56d4879694eee9b9de1e43db252d6`

### Supabase Edge Functions

Located in `supabase/functions/`:

- `team-create` - Team creation with validation
- `team-join` - Password validation, capacity checks
- `team-leave` - Cooldown enforcement
- `team-kick` - Owner-only member removal

## Rate Limits

| Action | Limit            |
| ------ | ---------------- |
| create | 10/hour/ip+user  |
| join   | 30/10min/ip+user |
| leave  | 30/hour/ip+user  |
| kick   | 20/hour/ip+user  |

## Deployment

### Worker

```sh
cd workers/team-gateway
npx wrangler deploy
```

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ALLOWED_ORIGIN`

### Edge Functions

```sh
supabase functions deploy
```

## Client Configuration

Set `NUXT_PUBLIC_TEAM_GATEWAY_URL` to the Worker URL. Falls back to direct Supabase if unset.

## Team Member Profile Data Flow

### Overview

Team member display names, levels, and progress data are fetched via a server-side API route that uses Supabase service role credentials to query the `user_progress` table. This architecture was chosen to avoid RLS (Row Level Security) permission issues when teammates try to view each other's data.

### Architecture Decision: Why Server-Side API?

**Problem**: Initially, the app tried to create dynamic Pinia stores for each teammate that would subscribe to `user_progress` via Supabase realtime. However, this hit RLS permission errors (406) because users don't have direct SELECT permission on other users' progress rows.

**Solution**: Fetch teammate profiles through a Nuxt server route (`app/server/api/team/members.ts`) that:
1. Uses **service role** credentials to bypass RLS
2. Validates the requesting user is actually a team member
3. Returns a snapshot of display names, levels, and task counts for all team members

### Data Flow Diagram

```
┌─────────────────┐
│  Team Page      │
│  (Client)       │
└────────┬────────┘
         │
         │ useTeamStoreWithSupabase()
         │   → refreshMembers()
         ▼
┌─────────────────────────────────┐
│ app/composables/api/            │
│   useEdgeFunctions.ts           │
│   → getTeamMembers(teamId)      │
└────────┬────────────────────────┘
         │ GET /api/team/members?teamId=...
         │ Authorization: Bearer <user_token>
         ▼
┌─────────────────────────────────┐
│ app/server/api/team/members.ts  │
│ (Server-side with service role) │
└────────┬────────────────────────┘
         │
         │ 1. Validate user token
         │ 2. Check user is team member
         │ 3. Fetch all team members
         │ 4. Query user_progress for profiles
         ▼
┌─────────────────────────────────┐
│ Supabase user_progress table    │
│ Columns (snake_case):            │
│   - user_id                      │
│   - current_game_mode            │
│   - pvp_data { displayName,      │
│                level,             │
│                taskCompletions }  │
│   - pve_data { ... }             │
└────────┬────────────────────────┘
         │ Returns profiles
         ▼
┌─────────────────────────────────┐
│ teamStore.memberProfiles         │
│ {                                │
│   [userId]: {                    │
│     displayName: string | null   │
│     level: number | null         │
│     tasksCompleted: number|null  │
│   }                              │
│ }                                │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ TeamMemberCard.vue               │
│ - Displays user's display name   │
│ - Shows level badge              │
│ - Shows task completion count    │
└─────────────────────────────────┘
```

### Database Schema: snake_case vs camelCase

**Critical Detail**: The Supabase `user_progress` table uses **snake_case** column names, but the client-side Pinia stores use **camelCase** property names. A transform function handles the conversion.

#### Database Columns (Supabase)
```typescript
{
  user_id: string;
  current_game_mode: 'pvp' | 'pve';
  game_edition: number;
  pvp_data: {
    displayName?: string;
    level?: number;
    taskCompletions?: Record<string, { complete: boolean }>;
    // ... other progress fields
  };
  pve_data: { /* same structure */ };
}
```

#### Client Store (Pinia)
```typescript
{
  currentGameMode: 'pvp' | 'pve';
  gameEdition: number;
  pvp: {
    displayName?: string;
    level?: number;
    taskCompletions?: Record<string, { complete: boolean }>;
    // ... other progress fields
  };
  pve: { /* same structure */ };
}
```

#### Transform Function (app/stores/useTarkov.ts:404-411)

When saving to Supabase:
```typescript
useSupabaseSync({
  store: tarkovStore,
  table: 'user_progress',
  transform: (state: UserState) => ({
    user_id: $supabase.user.id,
    current_game_mode: state.currentGameMode,  // camelCase → snake_case
    game_edition: state.gameEdition,
    pvp_data: state.pvp,                       // pvp → pvp_data
    pve_data: state.pve,                       // pve → pve_data
  }),
});
```

### Server API Implementation

#### File: `app/server/api/team/members.ts`

**Key Implementation Details**:

1. **Authentication**: Validates the user's JWT token via Supabase auth endpoint
2. **Authorization**: Verifies the user is a member of the requested team
3. **Query Construction**: Fetches profiles using the correct snake_case column names

```typescript
// Correct query (uses snake_case column names)
const query = `user_progress?select=user_id,current_game_mode,pvp_data,pve_data&user_id=in.(${idsParam})`;

// Data access (note the _data suffix)
const mode = p.current_game_mode || 'pvp';  // default to pvp
const data = p[`${mode}_data`];              // pvp_data or pve_data

// Extract profile data from the mode-specific object
profileMap[userId] = {
  displayName: data?.displayName ?? null,
  level: data?.level ?? null,
  tasksCompleted: Object.values(data?.taskCompletions || {})
    .filter(t => t?.complete).length
};
```

4. **Fallback Strategy**: If batch fetch fails, fetches each user individually to handle edge cases

### Client Store Implementation

#### File: `app/stores/useTeamStore.ts`

**Key Functions**:

**`refreshMembers()`** - Fetches team member profiles
```typescript
const refreshMembers = async () => {
  const currentTeamId = systemStore.$state.team_id;
  if (!currentTeamId) return;

  const { getTeamMembers } = useEdgeFunctions();
  const result = await getTeamMembers(currentTeamId);

  teamStore.$patch({
    members: result?.members || [],
    memberProfiles: result?.profiles || {},
  });
};
```

**`setupMembershipSubscription()`** - Listens for team membership changes
- Subscribes to `team_memberships` table via Supabase realtime
- Calls `refreshMembers()` when members join/leave
- Ensures profiles are always up-to-date

### Component Display Logic

#### File: `app/features/team/TeamMemberCard.vue`

**Display Name Fallback Chain**:
```typescript
const displayName = computed(() => {
  // 1. Try memberProfiles (from server API)
  const fromProfile = teamStore.memberProfiles?.[userId]?.displayName;

  // 2. Try progressStore (from client-side tarkov store)
  const fromProgress = progressStore.getDisplayName(userId);

  // 3. Fall back to truncated user ID
  return fromProfile || fromProgress || userId;
});
```

**Level Fallback Chain**:
```typescript
const level = computed(() => {
  // 1. Try memberProfiles (from server API)
  const fromProfile = teamStore.memberProfiles?.[userId]?.level;

  // 2. Try progressStore (from client-side tarkov store)
  const fromProgress = progressStore.getLevel(userId);

  return fromProfile ?? fromProgress;
});
```

**Task Completion Count**:
```typescript
const completedTaskCount = computed(() => {
  // 1. Try cached count from memberProfiles
  const profileCount = teamStore.memberProfiles?.[userId]?.tasksCompleted;
  if (profileCount != null) return profileCount;

  // 2. Calculate from progressStore (less efficient)
  return tasks.value.filter(task =>
    progressStore.tasksCompletions?.[task.id]?.[storeId] === true
  ).length;
});
```

### Bug Fix History (December 2025)

#### Issue: Display Names Showing as Truncated User IDs

**Symptoms**:
- Display names appeared as "OWNER_PVP" for one user but "c19186" (truncated UUID) for another
- Task completion counts were incorrect
- `teamStore.memberProfiles` was always empty

**Root Cause**:
The server API was initially written with **camelCase** column names (`currentGameMode`, `pvp`, `pve`), but the database actually uses **snake_case** names (`current_game_mode`, `pvp_data`, `pve_data`). This mismatch caused the query to return no data.

**Initial (Incorrect) Implementation**:
```typescript
// ❌ WRONG - database doesn't have these columns
const query = `user_progress?select=user_id,currentGameMode,pvp,pve&user_id=in.(${idsParam})`;
const data = p[mode]; // Looking for p.pvp or p.pve (doesn't exist)
```

**Fixed Implementation**:
```typescript
// ✅ CORRECT - matches actual database schema
const query = `user_progress?select=user_id,current_game_mode,pvp_data,pve_data&user_id=in.(${idsParam})`;
const data = p[`${mode}_data`]; // Looking for p.pvp_data or p.pve_data (exists!)
```

**Files Changed**:
- `app/server/api/team/members.ts` - Fixed query and data access to use snake_case
- `app/stores/useTeamStore.ts` - Added debug logging, fixed TypeScript errors
- `app/features/team/TeamMemberCard.vue` - Added debug logging for display name/level lookup

**Testing**:
Set `VITE_LOG_LEVEL=debug` in `.env` to see detailed logs:
```
[TeamStore] Got team members: {memberCount: 2, profileCount: 2, profiles: {...}}
[TeamMemberCard] Display name lookup: {userId: '...', fromProfile: 'OWNER_PVP', ...}
[team/members] User xyz...: mode=pvp, displayName=OWNER_PVP, level=15, tasksCompleted=11
```

### Real-Time Progress Updates

**Supabase Realtime Broadcast System**

The app uses Supabase's broadcast feature to push progress updates to all team members in real-time without polling the database.

#### How It Works

```
User completes task
    ↓
tarkovStore updates taskCompletions
    ↓
localProgressSnapshot computed property changes
    ↓
Watcher detects change
    ↓
Broadcasts to team channel via Supabase Realtime
    ↓
All teammates subscribed to channel receive broadcast
    ↓
memberProfiles updated with new data
    ↓
Vue reactivity triggers UI update
```

#### Implementation (app/stores/useTeamStore.ts:171-195)

**Setting up the channel**:
```typescript
teamChannel.value = $supabase.client
  .channel(`team:${currentTeamId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'team_memberships',
      filter: `team_id=eq.${currentTeamId}`,
    },
    () => {
      void refreshMembers(); // Refresh when members join/leave
    }
  )
  .on('broadcast', { event: 'progress' }, (payload) => {
    // Receive progress updates from teammates
    const data = payload?.payload;
    if (!data?.userId) return;

    // Update local cache with teammate's progress
    teamStore.$patch({
      memberProfiles: {
        ...teamStore.memberProfiles,
        [data.userId]: {
          displayName: data.displayName ?? null,
          level: data.level ?? null,
          tasksCompleted: data.tasksCompleted ?? null,
        },
      },
    });
  })
  .subscribe();
```

**Broadcasting updates** (app/stores/useTeamStore.ts:213-244):
```typescript
// Compute local user's progress snapshot
const localProgressSnapshot = computed(() => {
  const mode = tarkovStore.$state.currentGameMode || 'pvp';
  const modeState = tarkovStore.$state[mode];
  const completed = Object.values(modeState?.taskCompletions || {})
    .filter(t => t?.complete).length;

  return {
    mode,
    displayName: modeState?.displayName ?? null,
    level: modeState?.level ?? null,
    tasksCompleted: completed,
  };
});

// Watch for changes and broadcast to team
watch(
  () => localProgressSnapshot.value,
  (snapshot) => {
    if (!currentTeamId || !teamChannel.value) return;

    // Send broadcast to all teammates
    void teamChannel.value.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        userId: $supabase.user.id,
        displayName: snapshot.displayName,
        level: snapshot.level,
        tasksCompleted: snapshot.tasksCompleted,
        gameMode: snapshot.mode,
      },
    });

    // Also update local cache immediately (no round-trip delay)
    teamStore.$patch({
      memberProfiles: {
        ...teamStore.memberProfiles,
        [$supabase.user.id]: {
          displayName: snapshot.displayName,
          level: snapshot.level,
          tasksCompleted: snapshot.tasksCompleted,
        },
      },
    });
  },
  { deep: true }
);
```

#### What Gets Synced in Real-Time

- ✅ **Display name changes** - When user updates their display name
- ✅ **Level changes** - When user levels up
- ✅ **Task completions** - When user completes or uncompletes tasks
- ✅ **Game mode switches** - Automatically switches to show correct mode's data

#### Performance Characteristics

**Latency**:
- Typical broadcast latency: 50-200ms
- No database polling required
- Updates appear nearly instant to all teammates

**Scalability**:
- Supabase handles broadcast fan-out
- Each team member maintains one websocket connection
- Broadcasts are ephemeral (not persisted to database)
- Works efficiently with teams up to 10 members

**Fallback Strategy**:
- Initial load: Fetches profiles via server API (`/api/team/members`)
- Real-time: Updates via broadcasts
- Membership changes: Re-fetches all profiles
- Connection loss: Automatically reconnects via Supabase client

#### Testing Real-Time Sync

To verify the broadcast system is working:

1. **Open two browser windows** side-by-side
2. **Window 1**: Go to Dashboard or Tasks page
3. **Window 2**: Go to Team page
4. **Complete a task in Window 1**
5. **Observe Window 2**: Task count should update within ~100ms

**Debug Logs** (set `VITE_LOG_LEVEL=debug` in `.env`):
```
[TeamStore] Progress snapshot changed: {mode: 'pvp', tasksCompleted: 14, ...}
[TeamStore] Broadcasting progress to team: {userId: '...', tasksCompleted: 14}
[TeamStore] Applied broadcast locally, memberProfiles: {...}

# In other windows:
[TeamStore] Received broadcast: {userId: '...', tasksCompleted: 14, ...}
[TeamStore] Updated memberProfiles after broadcast: {...}
```

### Performance Considerations

**Why Broadcast Instead of Database Polling?**
- ⚡ **Instant updates** - No polling delay (typically 100-200ms vs 5-30 seconds)
- 💰 **Cost effective** - No repeated database queries
- 🔋 **Battery friendly** - No constant polling on mobile devices
- 🎯 **Precise** - Only updates when data actually changes

**Why Server API for Initial Load?**
- RLS policies prevent users from SELECT-ing other users' `user_progress` rows directly
- Service role credentials required to query teammates' data
- Server API called only on:
  - Team page load
  - Team membership changes (join/leave)
  - Manual refresh (if needed)

**Hybrid Approach Benefits**:
- Initial load: Authoritative data from database (via server API)
- Updates: Real-time broadcasts (millisecond latency)
- Membership changes: Re-sync from database
- Best of both worlds: Accuracy + Speed

### Debugging Tips

1. **Enable Debug Logs**:
   ```bash
   # Add to .env
   VITE_LOG_LEVEL=debug
   ```

2. **Check Server Logs**:
   Look for `[team/members]` prefix in your `npm run dev` terminal

3. **Check Browser Console**:
   Look for `[TeamStore]` and `[TeamMemberCard]` prefixes

4. **Verify Database Column Names**:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'user_progress';
   ```

5. **Test API Directly**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
     "http://localhost:3000/api/team/members?teamId=<team_id>"
   ```

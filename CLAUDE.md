# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TarkovTracker is a Nuxt 3-based web application for tracking progress in Escape from Tarkov. It supports both PvP and PvE game modes, team collaboration, and synchronizes user progress through Supabase.

## Code Organization Philosophy

**This project prioritizes flat structure and minimal abstraction:**

- Keep directory nesting shallow (prefer 2-3 levels over 4-5)
- Avoid creating abstractions or wrappers unless solving a real, current problem
- Don't speculate about future needs - refactor when duplication becomes painful
- Code should be easy to find and trace without excessive indirection

See `docs/APP_STRUCTURE.md` for detailed examples and anti-patterns.

## Key Commands

### Development

```bash
npm run dev              # Start development server on http://localhost:3000
npm run build            # Build for production
npm run preview          # Preview production build locally
npm install              # Install dependencies (runs postinstall: nuxt prepare)
```

### Code Quality

```bash
npx eslint .             # Run ESLint on the codebase
npx vitest               # Run tests (if configured)
```

## Architecture

### Application Structure

**SPA Mode**: This is a client-side only application (`ssr: false` in nuxt.config.ts). It uses Cloudflare Pages for deployment.

**Source Directory**: All application code lives in the `app/` directory (configured via `srcDir: "app"`)

**Component Organization**: See `docs/APP_STRUCTURE.md` for detailed explanation of how `app.vue`, layouts, and shell components are organized and why.

### State Management Architecture

The application uses a **three-store Pinia architecture**:

1. **`stores/tarkov.ts`** (Main Store): Tracks game progress (tasks, hideout, levels, etc.) for both PvP and PvE modes

   - Uses `shared_state.ts` for core state structure and actions
   - Implements game mode switching with `switchGameMode(mode)`
   - Auto-migrates legacy data structures via `migrateDataIfNeeded()`
   - Syncs to Supabase `user_progress` table when authenticated

2. **`stores/user.ts`** (User Preferences): UI preferences, view settings, tip visibility, streamer mode

   - Syncs to Supabase `user_preferences` table when authenticated
   - Does NOT store game progress data

3. **`stores/progress.ts`** (Computed Aggregations): Read-only store that aggregates data from tarkov store + team stores
   - Computes task completions across team members
   - Provides unified interface for accessing self + teammate progress
   - Uses `useTeamStore` to manage teammate stores dynamically

### Game Mode System

The app supports **two separate game modes** (PvP and PvE) with independent progress tracking:

- **Supported modes**: `'pvp'` and `'pve'` only (no "dual" mode)
- State structure: `{ currentGameMode: 'pvp' | 'pve', pvp: {...}, pve: {...} }`
- Constants defined in `app/utils/constants.ts`: `GAME_MODES.PVP` and `GAME_MODES.PVE`
- API game mode mapping: PVP → "regular", PVE → "pve" (via `API_GAME_MODES`)
- Each mode tracks: level, faction, taskCompletions, taskObjectives, hideoutModules, hideoutParts
- Users can switch modes via `GameModeSelector.vue` component

### Data Synchronization

**Supabase Integration** (`app/composables/supabase/`):

- `useSupabaseSync.ts`: Debounced two-way sync between Pinia stores and Supabase tables
- `useSupabaseListener.ts`: Real-time listeners for team updates via Supabase realtime
- Auth handled in `app/plugins/supabase.client.ts` with OAuth (Discord, Twitch)
- Main tables: `user_progress`, `user_preferences`, `teams`, `team_memberships`

**Migration System**:

- `useDataMigration.ts`: Handles legacy data structure migrations
- `migrateToGameModeStructure()` in `shared_state.ts`: Converts old single-mode state to separate PvP/PvE structure

### External Data Sources

**API Data Fetching** (tarkov.dev):

- Nuxt server-side routes in `app/server/api/tarkov/` act as a proxy to the `tarkov.dev` GraphQL API.
- Client-side composables like `useSharedTarkovDataQuery` use `$fetch` to call these server routes.
- This architecture provides caching, cleaner client-side code, and a single source of truth for data fetching.
- Fetches: tasks, hideout stations, maps, traders, player levels
- Data processing in `app/composables/data/` (useTaskData, useHideoutData, useMapData)

**Tarkov Data System**:

- `app/composables/tarkovdata.ts`: Central composable that initializes and exports all game data
- Uses graph structures (via `graphology`) for task dependencies
- Filters Scav Karma tasks via `EXCLUDED_SCAV_KARMA_TASKS` constant (tasks excluded until Fence Rep system is implemented)
- Exports: tasks, objectives, hideoutStations, maps, traders, etc.

### Component Organization

**Auto-imported components** from three locations:

- `app/components/`: General components
- `app/features/`: Feature-specific components (organized by domain: tasks, hideout, team, settings, etc.)
- `app/shell/`: App shell/chrome components (AppBar, NavDrawer, AppFooter)
- `app/layouts/`: Nuxt page layout wrappers (default.vue directly uses shell components)

Components are auto-imported without path prefix (`pathPrefix: false`), so `features/tasks/TaskCard.vue` is used as `<TaskCard />`.

### UI Framework & Styling

**Nuxt UI v4** (`@nuxt/ui`): Official Nuxt component library built on Tailwind CSS and Radix Vue primitives.

**Tailwind CSS v4**: Utility-first CSS framework configured via `@theme` blocks in `app/assets/css/tailwind.css`.

**Custom Theme**: The application uses a custom color system with:
- Primary/Brand colors (tan)
- Secondary colors (dark blue)
- Game mode colors (PVP tan, PVE blue)
- Semantic colors (success, warning, error)
- OKLCH color space for better perceptual consistency on modern browsers

**Typography**: "Share Tech Mono" font loaded from Google Fonts, applied to both sans and mono font families.

### Plugin System

Plugins in `app/plugins/` initialize core functionality:

- `supabase.client.ts`: Auth and database client
- `01.pinia.client.ts`: Pinia instance creation (numbered for load order)
- `store-initializer.ts`: Initializes Pinia stores and data migration
- `i18n.client.ts`: Internationalization support
- `metadata.client.ts`: Dynamic meta tag management

### TypeScript Configuration

Aliases configured in both `nuxt.config.ts` and tsconfig:

- `@/` and `~/` both resolve to `app/` directory
- Use these aliases consistently for imports

## Important Patterns

### Accessing Supabase

```typescript
const { $supabase } = useNuxtApp();
// Check auth: $supabase.user.loggedIn
// Get user ID: $supabase.user.id
// Database: $supabase.client.from('table')
```

### Accessing API Data

Composables in `app/composables/api/useSharedTarkovQuery.ts` handle client-side data fetching. They should be used instead of direct API calls.

```typescript
import { useSharedTarkovDataQuery } from '@/composables/api/useSharedTarkovQuery';

const { result, error, loading, refetch } = useSharedTarkovDataQuery();
```

### Game Mode Data Access

```typescript
const store = useTarkovStore();
const currentMode = store.currentGameMode; // 'pvp' or 'pve'
const currentData = store[currentMode]; // Access mode-specific data
```

### Working with Progress Store

```typescript
const progressStore = useProgressStore();
// Access team-wide completions
const completions = progressStore.tasksCompletions;
// completions[taskId][teamId] = boolean
```

## Team Features

### Team Management UI

The Team page (`app/pages/team.vue`) provides comprehensive team collaboration features:

**Team Display Name**:
- Located in `MyTeam.vue` component
- Editable input field with 15-character limit
- Per-game-mode storage (PVP and PVE have separate display names)
- Auto-saves on blur or Enter key press
- Changes sync to Supabase `user_progress` table via `useSupabaseSync`
- Accessed via `tarkovStore.getDisplayName()` / `tarkovStore.setDisplayName()`

**Team Invite System**:
- Show/Hide toggle for invite URL privacy
- Secure invite links with team ID and join code
- Copy-to-clipboard functionality
- URL format: `/team?team={teamId}&code={joinCode}`
- Hidden by default with user-friendly messaging

**Team Members Display**:
- Located in `TeamMembers.vue` component
- Always shows current user (even if not in backend members list)
- Current user sorted first in the list
- Owner badge displayed on team owner's card
- "(This is you)" indicator on current user's card
- Responsive grid layout (1 column mobile, 2 tablet, 3 desktop)

**Member Cards** (`TeammemberCard.vue`):
- Display name with Owner badge (if applicable)
- Player level with level badge image
- Task completion stats (X/Y tasks completed)
- Hide/Show teammate progress toggle
- Kick member button (owner-only)
- Improved responsive design with proper spacing

**Team Options** (`TeamOptions.vue`):
- Toggle visibility of teammates' tasks
- Toggle visibility of teammates' needed items
- Filter non-FIR items
- Filter hideout items
- Toggle map objectives visibility

### Team Data Stores

**System Store** (`stores/useSystemStore.ts`):
- Tracks user's team membership (`team_id` from `user_system` table)
- Real-time sync via `useSupabaseListener`
- Determines if user is in a team

**Team Store** (`stores/useTeamStore.ts`):
- Stores team metadata: owner, password/join_code, members
- Syncs from `teams` table via `useSupabaseListener`
- Supports legacy field mapping (owner_id → owner, join_code → password)
- Getters: `teamOwner`, `isOwner`, `teamPassword`, `teamMembers`, `teammates`

**Teammate Stores** (dynamic):
- Created automatically via `useTeammateStores()`
- One Pinia store per teammate (format: `teammate-{userId}`)
- Each syncs from `user_progress` table for that user
- Cleaned up when members leave the team

**Progress Store** (`stores/progress.ts`):
- Read-only aggregation layer
- Computes task completions across all team members
- Format: `tasksCompletions[taskId][userId] = boolean`
- Used throughout the app to show team progress

### Team Edge Functions

Located in `supabase/functions/`:
- `team-create/` - Creates new team with owner
- `team-join/` - Joins existing team with invite code
- `team-leave/` - Leaves/disbands team
- `team-kick/` - Kicks member (owner-only)

Called via `useEdgeFunctions()` composable which wraps the Supabase function invocations.

### Database Schema

**Tables**:
- `teams` - Team metadata (id, owner_id, name, join_code, max_members, created_at)
- `team_memberships` - Join table (team_id, user_id, joined_at)
- `user_system` - User's current team reference (user_id, team_id)
- `user_progress` - User's game progress including display_name per game mode

**Real-time Subscriptions**:
- `teams` table → `useTeamStore`
- `user_system` table → `useSystemStore`
- `user_progress` table → teammate stores (one per member)

### Team Page Layout

```
/team Page Structure:
├─ TeamInvite (if invite in URL query params)
├─ Team Management Section (2-column grid on desktop)
│  ├─ MyTeam
│  │  ├─ Display Name Editor (NEW in 2025-01)
│  │  ├─ Team Invite URL (Show/Hide toggle)
│  │  └─ Create/Leave/Disband Team button
│  └─ TeamOptions
│     └─ Team integration visibility toggles
└─ Team Members Section
   └─ Grid of TeammemberCard components
```

## Data Flow

1. **Initial Load**:

   - `app.vue` calls `useTarkovData()` to initialize composables for game data.
   - `store-initializer.ts` runs during plugin setup to hydrate stores from Supabase.
   - Auth state is initialized via `supabase.client.ts` plugin.

2. **User Interactions**:

   - UI components update Pinia stores.
   - `useSupabaseSync` watches for store changes (debounced).
   - Changes are automatically persisted to Supabase if authenticated.

3. **Team Collaboration**:
   - `useSupabaseListener` listens for team member changes.
   - Creates dynamic Pinia stores for each teammate via `useTeammateStores()`.
   - `progressStore` aggregates data across all team stores.
   - Team member updates trigger real-time UI updates across all team members.

## Testing

The project includes `@nuxt/test-utils` and `vitest` but test configuration may need verification. Check for `vitest.config.ts` or test files in `app/composables/__tests__/`.

## Deployment

Configured for Cloudflare Pages (`nitro.preset: "cloudflare-pages"`). The build creates static assets in `dist/` directory.

## Environment Variables

Required for Supabase integration:

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

These are accessed via `import.meta.env` in client-side code.
# Team UI Improvements (January 2025)

## Overview

This document details the comprehensive improvements made to the Team page UI/UX, focusing on better user experience, privacy controls, and display name management.

## Changes Summary

### 1. Display Name Management

**Problem**: Users had no way to change their display name shown to teammates. The name was randomly generated (e.g., "e17b0d") with no option to customize it.

**Solution**: Added a display name editor to the MyTeam component.

**Implementation**:
- **Location**: `app/features/team/MyTeam.vue` (lines 11-39)
- **Features**:
  - Text input with 15-character limit (enforced by `maxlength` attribute)
  - Auto-save on blur or Enter key press
  - Visual feedback with disabled/enabled Save button
  - Success notification on save
  - Per-game-mode storage (PVP and PVE have separate names)
- **State Management**:
  - Uses `tarkovStore.getDisplayName()` to read current name
  - Uses `tarkovStore.setDisplayName(name)` to update
  - Syncs to Supabase `user_progress` table automatically
  - Watches for external changes and updates local state

**Translation Keys Added** (`app/locales/en.json5`):
```json
{
  "display_name_placeholder": "Enter your display name (max 15 chars)",
  "display_name_hint": "This name will be shown to your teammates (max 15 characters)",
  "display_name_saved": "Display name saved successfully",
  "save": "Save"
}
```

### 2. Invite Link Privacy Controls

**Problem**: Invite link was displayed in a cut-off text input that didn't show the full URL properly and had privacy concerns for streamers.

**Solution**: Replaced with a show/hide toggle system with better formatting.

**Implementation**:
- **Location**: `app/features/team/MyTeam.vue` (lines 42-79)
- **Features**:
  - Hidden by default with privacy-friendly message
  - Show/Hide toggle button with eye icon
  - Full URL display in monospace font with word-wrapping when visible
  - Copy button only appears when link is visible
  - Better visual hierarchy with labels and actions separated
- **UI Components**:
  - UButton for Show/Hide toggle
  - UButton for Copy functionality
  - Rounded containers with proper background colors (light/dark mode)
  - Responsive layout with proper spacing

**Translation Keys Added**:
```json
{
  "show_link": "Show",
  "hide_link": "Hide",
  "copy_link": "Copy",
  "link_hidden_message": "Click 'Show' to reveal your team invite link"
}
```

### 3. Team Members Always Visible

**Problem**: Current user wasn't always shown in the Team Members list, causing confusion about membership status.

**Solution**: Modified TeamMembers component to always include and highlight current user.

**Implementation**:
- **Location**: `app/features/team/TeamMembers.vue` (lines 56-75)
- **Features**:
  - Computed property `allMembers` ensures current user is always included
  - Current user sorted first in the list
  - Fallback logic: adds current user if not in backend members array
- **Display Logic**:
  ```typescript
  const allMembers = computed(() => {
    const currentUID = $supabase.user.id;
    if (!currentUID) return teamMembers.value;

    const hasCurrentUser = teamMembers.value.includes(currentUID);

    if (hasCurrentUser) {
      // Sort so current user appears first
      return [...teamMembers.value].sort((a, b) => {
        if (a === currentUID) return -1;
        if (b === currentUID) return 1;
        return 0;
      });
    } else {
      // Add current user to the beginning
      return [currentUID, ...teamMembers.value];
    }
  });
  ```

### 4. Owner Badge

**Problem**: No visual indication of who owns the team.

**Solution**: Added "Owner" badge to team owner's member card.

**Implementation**:
- **Location**: `app/features/team/TeammemberCard.vue` (lines 11-13)
- **Features**:
  - UBadge component with "Owner" text
  - Primary color styling
  - Solid variant for emphasis
  - Computed property determines ownership:
    ```typescript
    const isOwner = computed(() => {
      const currentTeamOwner = teamStore.owner;
      return currentTeamOwner === props.teammember;
    });
    ```
- **Display**: Badge appears next to member's display name

**Translation Key Added**:
```json
{
  "owner": "Owner"
}
```

### 5. Enhanced Member Card Layout

**Problem**: Member cards were cramped and not responsive enough.

**Solution**: Redesigned TeammemberCard with better spacing and responsive layout.

**Implementation**:
- **Location**: `app/features/team/TeammemberCard.vue` (entire component)
- **Improvements**:
  - Increased padding: `p-4 sm:p-6` for better breathing room
  - Flexbox layout with proper gap spacing
  - Responsive text sizes: `text-xl sm:text-2xl` for name
  - Truncation for long names with `truncate` class
  - Visual separator between sections using border-top
  - Better color contrast for task completion stats
  - Larger, more touch-friendly buttons (size `sm` instead of `xs`)
  - Responsive level badge sizing: `h-12 w-12 sm:h-16 sm:h-16`

**Before/After Button Colors**:
- Before: `color="red"`, `color="green"`
- After: `color="error"`, `color="success"` (proper Nuxt UI colors)

### 6. Page Layout Improvements

**Problem**: Page structure was confusing with members appearing before team management.

**Solution**: Reorganized page layout with better visual hierarchy.

**Implementation**:
- **Location**: `app/pages/team.vue` (lines 1-30)
- **Structure**:
  ```
  Team Page:
  ├─ Invite Alert (if query params present)
  ├─ Team Management (2-column grid)
  │  ├─ MyTeam (Display name, Invite link, Actions)
  │  └─ TeamOptions (Visibility toggles)
  └─ Team Members (Full-width below)
     └─ Grid of member cards
  ```
- **Benefits**:
  - User controls at the top for quick access
  - Team members displayed prominently below
  - Responsive: 1 column on mobile, 2 on desktop
  - Better spacing with `space-y-6` between sections

## Technical Details

### Component Dependencies

```
team.vue
├── TeamInvite.vue (async)
├── MyTeam.vue (async)
│   ├── useTeamStoreWithSupabase()
│   ├── useSystemStoreWithSupabase()
│   ├── useTarkovStore()
│   └── useEdgeFunctions()
├── TeamOptions.vue (async)
└── TeamMembers.vue (async)
    ├── useTeamStoreWithSupabase()
    └── TeammemberCard.vue (multiple instances)
        ├── useProgressStore()
        ├── usePreferencesStore()
        ├── useMetadataStore()
        └── useTeamStoreWithSupabase()
```

### State Flow

```
Display Name:
User Input → displayName ref → saveDisplayName() → tarkovStore.setDisplayName()
→ Supabase sync (via useSupabaseSync) → user_progress table
→ Real-time update to all team members

Team Members:
Supabase teams table → useSupabaseListener → teamStore.$state.members
→ TeamMembers.vue computed (add current user if missing)
→ Sorted array (current user first) → v-for render
```

### Database Tables Affected

- **`user_progress`**: Stores `displayName` per game mode (pvp/pve)
- **`teams`**: Stores team metadata including `members` array
- **`user_system`**: Links user to their current team

### Styling Approach

All components use Nuxt UI components and Tailwind CSS:
- **Colors**: `primary`, `error`, `success` (not hardcoded hex values)
- **Spacing**: Consistent use of `gap-2`, `gap-4`, `space-y-4`
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Dark Mode**: Uses `dark:` variants for all color classes
- **Typography**: Font sizes scale with viewport (`text-xl sm:text-2xl`)

## Code Quality Improvements

### TypeScript Fixes

Fixed all ESLint `@typescript-eslint/no-explicit-any` errors:

**Before**:
```typescript
const owner = (teamStore.$state as any).owner_id ?? (teamStore.$state as any).owner;
```

**After**:
```typescript
const state = teamStore.$state as { owner_id?: string; owner?: string };
const owner = state.owner_id ?? state.owner;
```

**Payload Type**:
```typescript
interface TeamFunctionPayload {
  name?: string;
  password?: string;
  maxMembers?: number;
  teamId?: string;
}
```

### Build Validation

All changes passed:
- ✅ TypeScript compilation
- ✅ ESLint validation (0 errors, 0 warnings)
- ✅ Production build successful
- ✅ No runtime errors in development mode

## User Experience Impact

### Before
- ❌ Display name stuck as random string (e.g., "e17b0d")
- ❌ Invite link cut off in small input field
- ❌ Current user sometimes not visible in members list
- ❌ No indication of team ownership
- ❌ Cramped member cards
- ❌ Confusing page layout

### After
- ✅ Editable display name (max 15 chars, auto-save)
- ✅ Private invite link with show/hide toggle
- ✅ Current user always visible and sorted first
- ✅ Clear "Owner" badge on owner's card
- ✅ Spacious, responsive member cards
- ✅ Logical page layout (controls top, members below)

## Migration Notes

No database migrations required. All changes are UI-only and backward compatible:
- Display name field already exists in `user_progress` schema
- Team structure unchanged
- All existing data continues to work
- No breaking changes to APIs or composables

## Future Enhancements

Potential improvements for future iterations:
1. Display name validation (e.g., profanity filter, uniqueness check)
2. Team name editing (currently only display name is editable)
3. Member role system (owner, admin, member)
4. Team activity feed
5. Bulk member management
6. Team statistics dashboard
7. Custom team badges/avatars
8. Team chat/messaging

## Testing Checklist

Tested scenarios:
- ✅ Create team as new user
- ✅ Set display name with various lengths (1-15 chars)
- ✅ Display name persists across page refresh
- ✅ Display name syncs to teammates in real-time
- ✅ Invite link show/hide toggle works
- ✅ Copy invite link functionality
- ✅ Current user always appears in member list
- ✅ Owner badge displays correctly
- ✅ Leave team removes user from members
- ✅ Responsive layout on mobile/tablet/desktop
- ✅ Dark mode styling correct
- ✅ All buttons and inputs accessible via keyboard

## References

- Main Documentation: `/CLAUDE.md` (Team Features section)
- Architecture: `/docs/TEAM_ARCH.md`
- Backend Integration: `/docs/TEAM_GATEWAY.md`
- Component Files:
  - `/app/pages/team.vue`
  - `/app/features/team/MyTeam.vue`
  - `/app/features/team/TeamMembers.vue`
  - `/app/features/team/TeammemberCard.vue`
  - `/app/features/team/TeamOptions.vue`
- Stores:
  - `/app/stores/useSystemStore.ts`
  - `/app/stores/useTeamStore.ts`
  - `/app/stores/tarkov.ts`
  - `/app/stores/progress.ts`

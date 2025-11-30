# Comprehensive Codebase Analysis

**Analysis Date:** November 30, 2025
**Scope:** Full codebase deep-dive
**Status:** Updated after initial review and fixes.

---

## Executive Summary

This analysis covers the TarkovTrackerNuxt codebase. Several critical and high-priority issues identified in the previous analysis (Nov 29, 2025) have been resolved. The focus now shifts to completing the team feature implementation, optimizing performance (specifically state syncing), and addressing remaining architectural improvements.

---

## 1. Critical Issues (Action Required)

### 1.1 Incomplete Team Feature Implementation

**Location:** Multiple files in `app/features/team/`
**Severity:** Critical
**Impact:** Core feature is non-functional

Multiple team-related features are stubbed out with TODO comments:

*   `TeamMemberCard.vue`: Kicking members (Cloudflare integration needed)
*   `TeamInvite.vue`: Joining teams (Supabase logic needed)
*   `MyTeam.vue`: General team functions replacement

**Plan:**
1.  Verify Cloudflare Workers endpoints for team management (`team-kick`, `team-join`, etc.).
2.  Implement frontend integration in `app/features/team/` components to call these endpoints.
3.  Remove TODOs and console warnings.

---

## 2. High Priority Issues (Action Required)

### 2.1 Full-State Deep Clone on Every Sync

**Location:** `app/composables/supabase/useSupabaseSync.ts:99`
**Severity:** High (Performance)

```typescript
debouncedSync(JSON.parse(JSON.stringify(newState)));
```

**Impact:** Every state change triggers a full JSON serialization of the entire user progress state. With ~250 tasks and hideout modules, this creates significant memory pressure.

**Plan:**
1.  Implement dirty field tracking or a more efficient diffing mechanism.
2.  Only sync changed fields to Supabase.

### 2.2 Excessive Production Logging (Cleanup Needed)

**Location:** `app/stores/useTarkov.ts`, `app/composables/supabase/useSupabaseSync.ts`
**Severity:** Medium (was High)

**Status:** A `logger` utility has been introduced, and many logs are now guarded by `import.meta.dev`. However, some `console.log` and `console.warn` statements remain in production code paths (e.g., `persist` serializer in `useTarkov.ts`).

**Plan:**
1.  Audit `app/stores/useTarkov.ts` and replace remaining `console` calls with `logger`.
2.  Ensure `logger` properly suppresses debug logs in production.

### 2.3 Hideout Skill Validation Missing

**Location:** `app/features/hideout/HideoutCard.vue`
**Severity:** Medium (was High)

**Status:** Trader loyalty validation is implemented. Skill level validation is still a TODO.

```typescript
const isSkillReqMet = (_requirement) => {
  // TODO: Implement skill level tracking in user state
  return true;
};
```

**Plan:**
1.  Add `skills` to `UserProgressData` interface.
2.  Implement skill level tracking in `useProgressStore` or `useTarkovStore`.
3.  Update `isSkillReqMet` to check actual skill levels.

---

## 3. Medium Priority Issues (Architectural/Performance)

### 3.1 Prop Drilling in Task Components

**Location:** `app/features/tasks/TaskCard.vue` → `TaskInfo.vue` → `TaskActions.vue`
**Impact:** Component coupling, harder maintenance.

**Plan:** Use `provide`/`inject` for deeply nested context like `activeUserView` and `xs` breakpoints.

### 3.2 useBreakpoints Called Per Component Instance

**Location:** `app/features/tasks/TaskCard.vue`
**Impact:** Performance overhead (many event listeners).

**Plan:** Create a shared composable `useSharedBreakpoints` or use a singleton pattern.

### 3.3 JSON Deep Clone for Filtering

**Location:** `app/composables/useHideoutFiltering.ts`
**Impact:** Performance overhead on computed properties.

**Plan:** Refactor to filter in place or use shallow clones where possible.

### 3.4 Watchers Cleanup in Preferences

**Location:** `app/stores/usePreferences.ts`
**Status:** Improved with HMR checks, but still uses `setTimeout` and global variables.

**Plan:** Refactor to use `nuxtApp.hook('app:beforeUnmount', ...)` for cleaner lifecycle management.

---

## 4. Low Priority Issues (Cleanup)

*   **Commented-Out Code:** Remove legacy code in `useTarkov.ts` and `TeamInvite.vue`.
*   **Magic Numbers:** Move constants (e.g., cache TTLs, max lengths) to `constants.ts`.
*   **Inconsistent Error Messages:** Standardize error logging format.
*   **Async Components:** Optimize usage of `defineAsyncComponent` in `TaskCard.vue`.
*   **i18n Types:** Add type safety for translation keys.

---

## Resolved Issues (Summary)

The following issues from the previous analysis have been addressed:

1.  **CORS Wildcard in Edge Functions:** `supabase/functions/_shared/cors.ts` now correctly handles allowed origins instead of using a wildcard `*`.
2.  **Missing Account Deletion:** Frontend implementation added in `AccountDeletionCard.vue` calling `account-delete` edge function.
3.  **Missing Error Handling in Team Store:** `useTeamStore.ts` now includes try-catch blocks, error logging, and retry logic for teammate store creation.
4.  **Race Condition in Metadata Initialization:** `useMetadata.ts` now uses an initialization guard (`initPromise`) to prevent concurrent fetches.
5.  **Reactive Graph Objects in Pinia:** `useMetadata.ts` now uses `markRaw` for `taskGraph` and `hideoutGraph`, preventing reactivity overhead.
6.  **Inconsistent TypeScript Strictness:** `TeamInvite.vue` and others have been updated to use `<script setup lang="ts">`.

# Gemini 3.0 Analysis: Architectural & Code Quality Audit

This document outlines the findings from a deep-dive audit of the TarkovTrackerNuxt codebase, focusing on performance, data integrity, and synchronization safety.

## 1. Computed State Performance (Critical)

**Location:** `app/stores/progress.ts` (Lines 117-194)

**The Issue:**
The `unlockedTasks` computed property exhibits **O(N * M * R)** complexity, where:
- `N` is the number of tasks (~2000+)
- `M` is the number of visible team members (1-5)
- `R` is the number of requirements per task (variable, but can be deep)

This calculation runs synchronously on the main thread every time *any* dependency changes (e.g., a single task completion, a level up, or a trader level change).
- It iterates over *every* task in the metadata store.
- For *each* task, it iterates over *every* team member.
- Inside the loop, it performs multiple lookups (`tasksCompletions`, `traderLevelsAchieved`, `playerFaction`) and iterates over requirement arrays (`failedRequirements`, `traderLevelRequirements`, `taskRequirements`).

As the number of tasks grows (Tarkov has thousands), this will cause noticeable UI freezes ("Performance Cliffs"), especially when toggling a task status, as it triggers a full re-evaluation of the entire unlock graph for all users.

**The Fix:**
Refactor `unlockedTasks` to use a **reactive graph** or **memoization** approach. Instead of iterating over all tasks, we should only re-evaluate tasks that are immediate successors of the changed task.

**Recommendation:**
1.  **Pre-compute the dependency graph:** Use `useGraphBuilder` to create a reverse lookup map: `dependencyMap: { [completedTaskId]: [dependentTaskIds...] }`.
2.  **Event-Driven Updates:** Instead of a global computed property, use a store action `updateUnlockedState(changedTaskId)` that only checks the successors of the changed task.
3.  **Web Worker:** Offload the heavy graph traversal to a Web Worker to keep the main thread responsive.

```typescript
// Conceptual Fix (Store Action approach)
function updateUnlockedState(changedTaskId: string) {
  const successors = graph.getSuccessors(changedTaskId);
  successors.forEach(taskId => {
    // Only re-evaluate these specific tasks
    const isUnlocked = checkRequirements(taskId);
    unlockedTasks.value[taskId] = isUnlocked;
  });
}
```

## 2. Graph Integrity (High)

**Location:** `app/composables/useGraphBuilder.ts` (Lines 30-64)

**The Issue:**
The `buildTaskGraph` function assumes the API data is acyclic. If the external API introduces a circular dependency (e.g., Task A requires Task B, and Task B requires Task A), the graph builder might enter an infinite loop or stack overflow when traversing parents/children in other helpers (like `getPredecessors` in `graphHelpers.ts` if not implemented with cycle detection).
While `graphology` handles graph creation safely, the recursive traversal functions used later (`getPredecessors`, `getSuccessors`) could hang the browser if a cycle exists.

**The Fix:**
Implement cycle detection during graph construction or within the traversal helpers.

**Recommendation:**
Add a validation step before processing the graph.

```typescript
import { hasCycle } from 'graphology-dag';

// Inside processTaskData
const newGraph = buildTaskGraph(taskList);
if (hasCycle(newGraph)) {
  console.error("CRITICAL: Task dependency cycle detected! Graph traversal disabled.");
  // Fallback to safe mode or alert user
  return { ...safeEmptyState };
}
```

## 3. Sync Safety & "Bounce" Loops (High)

**Location:** `app/composables/supabase/useSupabaseSync.ts` & `app/composables/supabase/useSupabaseListener.ts`

**The Issue:**
There is a risk of an infinite update loop ("Bounce Loop") between the client and server.
1.  **Client:** User completes a task -> Store updates -> `useSupabaseSync` sends UPDATE to Supabase.
2.  **Server:** Supabase accepts UPDATE -> Broadcasts `postgres_changes` event.
3.  **Client:** `useSupabaseListener` receives event -> Patches Store.
4.  **Client:** Store update triggers `useSupabaseSync` watcher again.

Although `useSupabaseSync` has a debounce, it doesn't explicitly filter out updates that *originated* from the listener. If the server transforms the data (e.g., adds a timestamp) such that it differs slightly from the local state, the watcher will fire again, creating a loop.

**The Fix:**
Implement a "mute" flag or check the source of the change.

**Recommendation:**
Modify `useSupabaseListener` to temporarily pause the sync watcher while applying remote updates.

```typescript
// In useSupabaseListener.ts
const syncController = getSyncController(); // Need a way to access the active sync controller

// Inside the postgres_changes callback
if (payload.eventType === "UPDATE") {
  syncController.pause(); // Stop sync from reacting to this patch
  safePatchStore(store, payload.new);
  // Wait for next tick or small delay
  setTimeout(() => syncController.resume(), 100);
}
```

## 4. Data Migration Race Condition (Medium)

**Location:** `app/stores/tarkov.ts` (Lines 404-455)

**The Issue:**
In `initializeTarkovSync`, the logic is:
1.  Fetch Supabase data.
2.  If Supabase data exists, use it.
3.  Else if LocalStorage exists, migrate it to Supabase.

**Scenario:** A user opens the app in two tabs (or a desktop and mobile) simultaneously for the first time.
- **Tab A:** Sees no Supabase data, starts migrating LocalStorage -> Supabase.
- **Tab B:** Sees no Supabase data (race), starts migrating LocalStorage -> Supabase.

Both tabs will attempt to `upsert` the initial migration data. While `upsert` is generally safe, if the LocalStorage state differs slightly (e.g., one tab has an older cached version), the last write wins, potentially overwriting progress made in the few seconds between the two opens.

**The Fix:**
This is a classic distributed system problem. For a client-side app, "Last Write Wins" is often acceptable, but we can improve safety.

**Recommendation:**
When migrating, use a conditional insert or check for existence *immediately* before writing if possible. However, a simpler fix for the client is to ensure `initializeTarkovSync` handles the "upsert" response gracefully. If Tab A finishes first, Tab B's upsert might overwrite it.
A better approach:
- If `data` is null, attempt to *insert* (not upsert) the migrated data.
- If the insert fails (conflict), it means another client initialized it. Then fetch again.

## Summary of Recommendations

1.  **Refactor `unlockedTasks`:** Move away from O(N*M) computed properties. Use an event-driven graph update mechanism.
2.  **Graph Validation:** Add `hasCycle` check to `useGraphBuilder` to prevent crashes from bad API data.
3.  **Break Sync Loops:** Explicitly pause `useSupabaseSync` when applying updates from `useSupabaseListener`.
4.  **Migration Safety:** Consider using `insert` instead of `upsert` for the initial migration to detect race conditions.
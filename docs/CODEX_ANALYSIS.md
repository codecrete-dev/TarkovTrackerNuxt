# CODEX Analysis – TarkovTrackerNuxt (2025-11-26)

## [CRITICAL]
- **Supabase system store throws at runtime (missing import + non-reactive filter)** — `app/stores/useSystemStore.ts:1-51` uses `watch(...)` without importing it, so calling `useSystemStoreWithSupabase()` raises `ReferenceError: watch is not defined`, preventing tokens/team metadata from loading and leaving the store empty. Fix: import `watch` from `vue` and guard instantiation. Example: `import { computed, watch } from 'vue';` then pass a reactive filter ref into the listener.
- **Realtime listeners never (re)bind to the authenticated user** — filters are passed as plain strings (`systemFilter.value`, `teamFilter.value`) into `useSupabaseListener`, and the listener itself watches `() => filter` (a constant string) rather than a ref (`app/composables/supabase/useSupabaseListener.ts:116-124`). When a user logs in/out, no new subscription or initial fetch occurs, so data can remain for the previous user or stay empty. Refactor to accept a `Ref<string | undefined>` and watch its `.value`, e.g. `watch(filterRef, (f) => { cleanup(); if (f) { fetchData(f); subscribe(f); } }, { immediate: true });` and pass the computed ref directly.

## [MAJOR]
- **String-parsed filters allow malformed or over-broad subscriptions** — `useSupabaseListener` splits `filter.split("=eq.")` and reuses the raw string in the realtime `filter` option (`app/composables/supabase/useSupabaseListener.ts:38-88`). A user id containing `.`/`=`, or a crafted string like `user_id=eq.*` would either break parsing (no initial data) or subscribe to every row. Build filters with structured params instead: accept `{ column, value }`, call `.eq(column, value)` for queries, and compose the realtime filter with `filter: `${column}=eq.${encodeURIComponent(value)}`` after validating `value` against `/^[\w-]+$/`.
- **Full-state deep clones + upserts on every change** — `useSupabaseSync` watches the entire store deeply and `JSON.parse(JSON.stringify(newState))` each time before `upsert` (`app/composables/supabase/useSupabaseSync.ts:97-105`). For large progress payloads this is O(n) per mutation, floods Supabase with whole-document writes, and risks overwriting newer server data because there is no version/etag check. Prefer patch semantics: track dirty fields, include a `updated_at` version, and send minimal columns (e.g., only the affected game mode) on a throttled schedule.
- **HTML escaping disabled in i18n pipeline** — Nuxt i18n plugin is instantiated with `escapeHtml: false` (`nuxt.config.ts:117-123`). Any translation string that contains user-provided values (present or future) will render raw HTML, creating an XSS sink. Turn escaping back on or sanitize interpolated values before injection.

## [MINOR/SUGGESTION]
- **Verbose PII-rich logging in production** — Sync layer logs user ids, levels, and task counts for every write (`app/composables/supabase/useSupabaseSync.ts:64-88`; also multiple logs in `app/stores/tarkov.ts`). Consider gating logs with `if (import.meta.dev)` or a dedicated debug flag to avoid leaking identifiers to shared consoles/monitoring.
- **User-facing actions intentionally throw** — Team kick and account deletion buttons surface TODO placeholders and thrown errors (e.g., `app/features/team/TeammemberCard.vue:93-118`, `app/features/settings/AccountDeletionCard.vue:327-370`). Hide these controls or route them through feature flags until backend support exists to avoid broken flows.

### Quick Fix Examples
- Import and use reactive filters:
  ```ts
  // app/stores/useSystemStore.ts
  import { computed, watch } from 'vue';
  const systemFilter = computed(() => $supabase.user.loggedIn ? `user_id=eq.${$supabase.user.id}` : undefined);
  useSupabaseListener({ store: systemStore, table: 'user_system', filter: systemFilter });
  ```
- Harden listener filter API:
  ```ts
  // app/composables/supabase/useSupabaseListener.ts
  export interface SupabaseListenerConfig { filter?: Ref<{ column: string; value: string } | undefined>; }
  const where = filterRef.value;
  const realtimeFilter = `${where.column}=eq.${encodeURIComponent(where.value)}`;
  supabase.client.from(table).select('*').eq(where.column, where.value).single();
  ```
- Reduce sync churn:
  ```ts
  // app/composables/supabase/useSupabaseSync.ts
  const pendingPatch = shallowRef<Partial<UserState>>({});
  watch(() => store.$state.pvp, (pvp) => pendingPatch.value.pvp_data = pvp, { deep: true });
  const debouncedSave = debounce(() => supabase.from(table).upsert({ user_id, ...pendingPatch.value, updated_at: new Date().toISOString() }), 1500);
  ```

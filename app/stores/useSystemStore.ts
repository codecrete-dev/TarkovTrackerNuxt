import { defineStore } from 'pinia';
import { computed, watch, type Ref } from 'vue';
import { useSupabaseListener } from '@/composables/supabase/useSupabaseListener';
import type { SystemGetters, SystemState } from '@/types/tarkov';
import { logger } from '@/utils/logger';
import type { Store } from 'pinia';
/**
 * System store definition with getters for user tokens and team info
 */
export const useSystemStore = defineStore<string, SystemState, SystemGetters>('system', {
  state: (): SystemState => ({}),
  getters: {
    userTokens(state) {
      return state?.tokens || [];
    },
    userTokenCount(state) {
      return state?.tokens?.length || 0;
    },
    userTeam(state): string | null {
      // Support both 'team' (canonical) and 'team_id' (from database)
      // Access team_id directly for Vue reactivity
      const stateAny = state as unknown as { team?: string | null; team_id?: string | null };
      const teamId = stateAny.team ?? stateAny.team_id ?? null;
      return teamId;
    },
    userTeamIsOwn(state) {
      const { $supabase } = useNuxtApp();
      const stateAny = state as unknown as { team?: string | null; team_id?: string | null };
      const teamId = stateAny.team ?? stateAny.team_id ?? null;
      return teamId === $supabase.user?.id || false;
    },
  },
});
// Type for the system store instance to avoid circular reference
interface SystemStoreInstance {
  systemStore: Store<string, SystemState, SystemGetters>;
  isSubscribed: Ref<boolean>;
  cleanup: () => void;
}
// Singleton instance to prevent multiple listener setups
let systemStoreInstance: SystemStoreInstance | null = null;
export function useSystemStoreWithSupabase(): SystemStoreInstance {
  // Return cached instance if it exists
  if (systemStoreInstance) {
    logger.debug('[SystemStore] Returning cached instance');
    return systemStoreInstance;
  }
  logger.debug('[SystemStore] Creating new instance');
  const systemStore = useSystemStore();
  const { $supabase } = useNuxtApp();
  const handleSystemSnapshot = (data: Record<string, unknown> | null) => {
    logger.debug('[SystemStore] handleSystemSnapshot called with data:', data);
    if (data && 'team_id' in data) {
      const teamId = (data as { team_id: string | null }).team_id;
      logger.debug('[SystemStore] Patching store with team_id:', teamId);
      systemStore.$patch({
        team: teamId,
        team_id: teamId,
      } as Partial<SystemState>);
      logger.debug('[SystemStore] Store state after patch:', systemStore.$state);
    } else if (data === null) {
      logger.debug('[SystemStore] Patching store with null team');
      systemStore.$patch({ team: null, team_id: null } as Partial<SystemState>);
    } else {
      logger.warn('[SystemStore] Received data without team_id field:', data);
    }
  };
  // Computed reference to the system document - passed as ref for reactivity
  const systemFilter = computed(() => {
    const filter = $supabase.user.loggedIn && $supabase.user.id
      ? `user_id=eq.${$supabase.user.id}`
      : undefined;
    logger.debug('[SystemStore] systemFilter computed:', filter);
    return filter;
  });
  logger.debug('[SystemStore] Setting up Supabase listener for user_system table');
  logger.debug('[SystemStore] Current user:', {
    loggedIn: $supabase.user.loggedIn,
    id: $supabase.user.id,
  });
  // Setup Supabase listener with reactive filter ref
  const { cleanup, isSubscribed } = useSupabaseListener({
    store: systemStore,
    table: 'user_system',
    filter: systemFilter, // Pass the ref, not the value
    storeId: 'system',
    onData: handleSystemSnapshot,
  });
  logger.debug('[SystemStore] Listener setup complete, subscription status:', isSubscribed.value);
  // Watch for store state changes
  watch(
    () => systemStore.$state,
    (newState) => {
      const stateAny = newState as unknown as { team?: string | null; team_id?: string | null };
      logger.debug('[SystemStore] Store state changed, team/team_id:', {
        team: stateAny.team,
        team_id: stateAny.team_id,
        fullState: newState,
      });
    },
    { deep: true }
  );
  // Also watch the getter
  watch(
    () => systemStore.userTeam,
    (newTeam, oldTeam) => {
      logger.debug('[SystemStore] userTeam getter changed:', { oldTeam, newTeam });
    }
  );
  // Cache the instance
  const instance = {
    systemStore,
    isSubscribed,
    cleanup,
  };
  systemStoreInstance = instance;
  return instance;
}

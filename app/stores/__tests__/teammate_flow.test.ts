import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick, ref } from 'vue';
import { useSystemStoreWithSupabase } from '../useSystemStore';
import { useTeamStoreWithSupabase, useTeammateStores } from '../useTeamStore';
// Mock dependencies
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/composables/api/useEdgeFunctions', () => ({
  useEdgeFunctions: () => ({
    getTeamMembers: vi.fn().mockResolvedValue({
      members: ['user-1', 'user-2'],
      profiles: {
        'user-2': { displayName: 'Teammate', level: 10, tasksCompleted: 5 }
      }
    }),
  }),
}));
// Mock Supabase
const mockSupabase = {
  user: {
    loggedIn: true,
    id: 'user-1',
  },
  client: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      removeChannel: vi.fn(),
      send: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
};
vi.mock('#imports', () => ({
  useNuxtApp: () => ({
    $supabase: mockSupabase,
  }),
  useToast: () => ({
    add: vi.fn(),
  }),
}));
// Mock useSupabaseListener to avoid actual subscription logic
vi.mock('@/composables/supabase/useSupabaseListener', () => ({
  useSupabaseListener: ({ onData }: { onData?: (data: unknown) => void; filter?: unknown }) => {
    return {
      cleanup: vi.fn(),
      isSubscribed: ref(true),
      triggerData: (data: unknown) => onData && onData(data),
    };
  },
}));
describe('Teammate Store Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });
  it('should create teammate stores when members are added to team store', async () => {
    // 1. Initialize System Store and simulate team assignment
    const { systemStore } = useSystemStoreWithSupabase();
    systemStore.$patch((state) => {
      state.team = 'team-123';
      state.team_id = 'team-123';
    });
    // 2. Initialize Team Store
    const { teamStore } = useTeamStoreWithSupabase();
    // 3. Initialize Teammate Stores manager
    const { teammateStores } = useTeammateStores();
    // 4. Simulate team data arriving (which triggers member refresh)
    // We manually patch members here to simulate the flow
    teamStore.$patch((state) => {
      state.members = ['user-1', 'user-2']; // user-1 is self, user-2 is teammate
    });
    // Wait for watchers to fire
    await nextTick();
    await nextTick();
    await nextTick();
    // 5. Verify teammate store creation
    // Should have store for user-2, but not user-1 (self)
    expect(teammateStores.value['user-2']).toBeDefined();
    expect(teammateStores.value['user-1']).toBeUndefined();
    // 6. Verify store content
    const teammateStore = teammateStores.value['user-2'];
    expect(teammateStore).toBeDefined();
    // Check if it has the correct ID structure
    expect(teammateStore?.$id).toBe('teammate-user-2');
  });
  it('should handle dynamic member updates', async () => {
    const { teamStore } = useTeamStoreWithSupabase();
    const { teammateStores } = useTeammateStores();
    // Initial state
    teamStore.$patch((state) => {
      state.members = ['user-1', 'user-2'];
    });
    await nextTick();
    await nextTick();
    await nextTick();
    expect(teammateStores.value['user-2']).toBeDefined();
    // Add new member
    teamStore.$patch((state) => {
      state.members = ['user-1', 'user-2', 'user-3'];
    });
    await nextTick();
    await nextTick();
    await nextTick();
    expect(teammateStores.value['user-3']).toBeDefined();
    expect(teammateStores.value['user-2']).toBeDefined();
    // Remove member
    teamStore.$patch((state) => {
      state.members = ['user-1', 'user-3'];
    });
    await nextTick();
    await nextTick();
    await nextTick();
    expect(teammateStores.value['user-2']).toBeUndefined();
    expect(teammateStores.value['user-3']).toBeDefined();
  });
});
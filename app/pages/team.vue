<template>
  <div class="container mx-auto space-y-6 px-4 py-6">
    <div v-if="route?.query?.team && route?.query?.code" class="mx-auto max-w-6xl">
      <TeamInvite />
    </div>
    <div class="relative mx-auto max-w-6xl">
      <div class="space-y-6">
        <!-- Team Management Section -->
        <div class="grid gap-4 lg:grid-cols-2">
          <MyTeam />
          <TeamOptions />
        </div>
        <!-- Team Members Section -->
        <TeamMembers v-if="userHasTeam" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { computed, defineAsyncComponent, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useSystemStoreWithSupabase } from '@/stores/useSystemStore';
  import { logger } from '@/utils/logger';
  const TeamMembers = defineAsyncComponent(() => import('@/features/team/TeamMembers.vue'));
  const TeamOptions = defineAsyncComponent(() => import('@/features/team/TeamOptions.vue'));
  const MyTeam = defineAsyncComponent(() => import('@/features/team/MyTeam.vue'));
  const TeamInvite = defineAsyncComponent(() => import('@/features/team/TeamInvite.vue'));
  const { systemStore } = useSystemStoreWithSupabase();
  const route = useRoute();
  logger.debug('[TeamPage] Initial systemStore state:', systemStore.$state);
  logger.debug('[TeamPage] systemStore.userTeam:', systemStore.userTeam);
  const userHasTeam = computed(() => {
    const state = systemStore.$state as unknown as { team?: string | null; team_id?: string | null };
    return !!(state.team ?? state.team_id);
  });
  watch(
    () => userHasTeam.value,
    (hasTeam, hadTeam) => {
      logger.debug('[TeamPage] userHasTeam changed:', { hadTeam, hasTeam });
      const state = systemStore.$state as unknown as { team?: string | null; team_id?: string | null };
      logger.debug('[TeamPage] Current team ID:', state.team ?? state.team_id);
    }
  );
</script>

<template>
  <UAlert
    v-if="hasInviteInUrl && !inInviteTeam && !declined"
    color="success"
    variant="solid"
    icon="i-mdi-handshake"
    class="mb-4"
  >
    <template #title>
      <div class="flex w-full flex-row items-center justify-between">
        <div>
          {{ $t('page.team.card.teaminvite.description') }}
        </div>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="accepting"
            :loading="accepting"
            @click="acceptInvite"
          >
            {{ $t('page.team.card.teaminvite.accept') }}
          </UButton>
          <UButton color="neutral" variant="outline" :disabled="accepting" @click="declined = true">
            {{ $t('page.team.card.teaminvite.decline') }}
          </UButton>
        </div>
      </div>
    </template>
  </UAlert>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useSystemStore } from '@/stores/useSystemStore';
  import { useToast } from '#imports';
  const systemStore = useSystemStore();
  const route = useRoute();
  const toast = useToast();
  const hasInviteInUrl = computed(() => {
    return !!(route.query.team && route.query.code);
  });
  const inInviteTeam = computed(() => {
    return systemStore?.userTeam != null && systemStore.userTeam == route?.query?.team;
  });
  const declined = ref(false);
  const accepting = ref(false);
  const acceptInvite = async () => {
    if (!route.query.team || !route.query.code) return;
    accepting.value = true;
    const { $supabase } = useNuxtApp();
    try {
      const { data, error } = await $supabase.client.functions.invoke('team-join', {
        body: {
          team_id: route.query.team,
          join_code: route.query.code,
        },
      });
      if (error) {
        throw error;
      }
      if (data?.success) {
        toast.add({
          title: 'Joined team successfully!',
          color: 'success',
        });
        // Refresh page to update state
        window.location.reload();
      } else {
        throw new Error(data?.message || 'Failed to join team');
      }
    } catch (err) {
      const error = err as Error & { data?: { message?: string } };
      const message = error?.message || error?.data?.message || String(err);
      console.error('[TeamInvite.vue] Error joining team:', error);
      toast.add({
        title: message,
        color: 'error',
      });
    } finally {
      accepting.value = false;
    }
  };
</script>

<template>
  <div class="container mx-auto px-4 py-6 space-y-4">
    <div
      v-if="route?.query?.team && route?.query?.code"
      class="max-w-5xl mx-auto"
    >
      <TeamInvite />
    </div>
    <div class="relative max-w-6xl mx-auto">
      <div class="grid gap-4">
        <TeamMembers v-if="systemStore.$state.team" class="col-span-full" />
        <div class="grid gap-4 md:grid-cols-2">
          <MyTeam />
          <TeamOptions />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useSystemStoreWithSupabase } from "@/stores/useSystemStore";
import { useRoute } from "vue-router";
const TeamMembers = defineAsyncComponent(() =>
  import("@/features/team/TeamMembers")
);
const TeamOptions = defineAsyncComponent(() =>
  import("@/features/team/TeamOptions")
);
const MyTeam = defineAsyncComponent(() => import("@/features/team/MyTeam"));
const TeamInvite = defineAsyncComponent(() =>
  import("@/features/team/TeamInvite")
);
const { $supabase } = useNuxtApp();
const { systemStore } = useSystemStoreWithSupabase();
const route = useRoute();
const user = computed(() => ({
  loggedIn: $supabase.user.loggedIn,
}));
</script>

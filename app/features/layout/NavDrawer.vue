<template>
  <!-- Mobile Drawer -->
  <USlideover
    v-if="mdAndDown"
    v-model="drawerOpen"
    side="left"
    :ui="{ width: 'max-w-xs' }"
  >
    <div
      class="flex grow flex-col gap-y-5 overflow-y-auto nav-shell backdrop-blur-sm px-6 pb-4 ring-1 ring-white/10 h-full relative border-r border-surface-800/70"
    >
      <div class="relative z-10 flex flex-col h-full">
        <TrackerLogo :is-collapsed="false" />
        <div class="h-px bg-primary-800/40 my-1" />
        <DrawerAccount :is-collapsed="false" />
        <div class="h-px bg-primary-800/40 my-1" />
        <DrawerLevel :is-collapsed="false" />
        <DrawerCharacter :is-collapsed="false" />
        <div class="h-px bg-primary-800/40 my-1" />
        <DrawerLinks :is-collapsed="false" />
        <div class="h-px bg-primary-800/40 my-1" />
        <DrawerExternalLinks :is-collapsed="false" />
      </div>
    </div>
  </USlideover>
  <!-- Desktop Sidebar -->
  <aside
    v-show="!mdAndDown"
    class="flex flex-col fixed inset-y-0 left-0 z-30 nav-shell backdrop-blur-sm border-r border-primary-800/60 transition-all duration-300"
    :class="[isRailActive ? 'w-14' : 'w-56']"
  >
    <div
      class="relative z-10 flex flex-col h-full overflow-y-auto overflow-x-hidden"
    >
      <TrackerLogo :is-collapsed="isRailActive" />
      <div class="h-px bg-primary-800/40 mx-3 my-1" />
      <DrawerAccount :is-collapsed="isRailActive" />
      <div class="h-px bg-primary-800/40 mx-3 my-1" />
      <DrawerLevel :is-collapsed="isRailActive" />
      <DrawerCharacter :is-collapsed="isRailActive" />
      <div class="h-px bg-primary-800/40 mx-3 my-1" />
      <DrawerLinks :is-collapsed="isRailActive" />
      <div class="h-px bg-primary-800/40 mx-3 my-1" />
      <DrawerExternalLinks :is-collapsed="isRailActive" />
    </div>
  </aside>
</template>
<script setup>
import { defineAsyncComponent, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { useBreakpoints } from "@vueuse/core";
// Define breakpoints (matching Vuetify's md breakpoint at 960px)
const breakpoints = useBreakpoints({
  mobile: 0,
  md: 960,
});
const mdAndDown = breakpoints.smaller("md");
const appStore = useAppStore();
const isRailActive = computed(() => !mdAndDown.value && appStore.drawerRail);
const drawerOpen = computed({
  get: () => mdAndDown.value && appStore.drawerShow,
  set: (val) => {
    appStore.drawerShow = val;
  },
});
const TrackerLogo = defineAsyncComponent(() =>
  import("@/features/drawer/TrackerLogo.vue")
);
const DrawerLinks = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerLinks.vue")
);
const DrawerAccount = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerAccount.vue")
);
const DrawerLevel = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerLevel.vue")
);
const DrawerExternalLinks = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerExternalLinks.vue")
);
const DrawerCharacter = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerCharacter.vue")
);
</script>
<style scoped>
.nav-shell {
  background: linear-gradient(
    180deg,
    rgba(18, 18, 20, 0.96) 0%,
    rgba(14, 14, 15, 0.96) 45%,
    rgba(12, 12, 13, 0.97) 100%
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03),
    inset 0 -1px 0 rgba(0, 0, 0, 0.6), 1px 0 0 rgba(0, 0, 0, 0.55);
}
.border-gradient {
  background: linear-gradient(
    to bottom,
    rgba(82, 82, 91, 0.45) 0%,
    rgba(39, 39, 42, 0.25) 50%,
    transparent 100%
  );
  border-right-width: 1px;
  border-right-style: solid;
  border-image: linear-gradient(
      to bottom,
      rgba(82, 82, 91, 0.55) 0%,
      rgba(39, 39, 42, 0.35) 50%,
      transparent 100%
    )
    1;
}
</style>

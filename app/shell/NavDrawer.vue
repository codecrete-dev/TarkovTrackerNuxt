<template>
  <!-- Backdrop overlay for mobile expanded state -->
  <Transition name="fade">
    <div
      v-if="mdAndDown && mobileExpanded"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      @click="closeMobileDrawer"
    />
  </Transition>
  <!-- Unified Sidebar - works as rail on mobile, rail/expanded on desktop -->
  <aside
    class="nav-shell border-primary-800/60 fixed inset-y-0 left-0 z-50 flex flex-col border-r backdrop-blur-sm transition-all duration-300"
    :class="[sidebarWidth]"
  >
    <div class="relative z-10 flex h-full flex-col overflow-x-hidden overflow-y-auto">
      <TrackerLogo :is-collapsed="isCollapsed" />
      <div class="bg-primary-800/40 mx-3 my-1 h-px" />
      <DrawerAccount :is-collapsed="isCollapsed" />
      <div class="bg-primary-800/40 mx-3 my-1 h-px" />
      <DrawerLevel :is-collapsed="isCollapsed" />
      <DrawerCharacter :is-collapsed="isCollapsed" />
      <div class="bg-primary-800/40 mx-3 my-1 h-px" />
      <DrawerLinks :is-collapsed="isCollapsed" />
      <div class="bg-primary-800/40 mx-3 my-1 h-px" />
      <DrawerExternalLinks :is-collapsed="isCollapsed" />
    </div>
  </aside>
</template>
<script setup>
  import { useBreakpoints } from '@vueuse/core';
  import { computed, defineAsyncComponent, watch } from 'vue';
  import { useAppStore } from '@/stores/useApp';
  // Define breakpoints (matching Vuetify's md breakpoint at 960px)
  const breakpoints = useBreakpoints({
    mobile: 0,
    md: 960,
  });
  const mdAndDown = breakpoints.smaller('md');
  const appStore = useAppStore();
  // Mobile expanded state from store
  const mobileExpanded = computed(() => appStore.mobileDrawerExpanded);
  // Close mobile expanded when switching to desktop
  watch(mdAndDown, (isMobile) => {
    if (!isMobile) {
      appStore.setMobileDrawerExpanded(false);
    }
  });
  const closeMobileDrawer = () => {
    appStore.setMobileDrawerExpanded(false);
  };
  // Determine if sidebar should be collapsed (rail mode)
  const isCollapsed = computed(() => {
    if (mdAndDown.value) {
      // On mobile: collapsed unless expanded
      return !mobileExpanded.value;
    }
    // On desktop: based on rail setting
    return appStore.drawerRail;
  });
  // Determine sidebar width class
  const sidebarWidth = computed(() => {
    if (mdAndDown.value) {
      // Mobile: rail by default, expanded when open
      return mobileExpanded.value ? 'w-56' : 'w-14';
    }
    // Desktop: based on rail setting
    return appStore.drawerRail ? 'w-14' : 'w-56';
  });
  const TrackerLogo = defineAsyncComponent(() => import('@/features/drawer/TrackerLogo.vue'));
  const DrawerLinks = defineAsyncComponent(() => import('@/features/drawer/DrawerLinks.vue'));
  const DrawerAccount = defineAsyncComponent(() => import('@/features/drawer/DrawerAccount.vue'));
  const DrawerLevel = defineAsyncComponent(() => import('@/features/drawer/DrawerLevel.vue'));
  const DrawerExternalLinks = defineAsyncComponent(
    () => import('@/features/drawer/DrawerExternalLinks.vue')
  );
  const DrawerCharacter = defineAsyncComponent(
    () => import('@/features/drawer/DrawerCharacter.vue')
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
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.03),
      inset 0 -1px 0 rgba(0, 0, 0, 0.6),
      1px 0 0 rgba(0, 0, 0, 0.55);
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>

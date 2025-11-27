<template>
  <header
    class="fixed top-0 inset-x-0 z-50 h-16 backdrop-blur-sm bg-linear-to-tr from-surface-800/95 to-surface-950/95 border-b border-primary-800/60 shadow-[0_1px_0_rgba(0,0,0,0.4)]"
  >
    <div class="h-full px-3 flex items-center gap-3">
      <!-- Left: Toggle Button -->
      <UButton
        :icon="navBarIcon"
        variant="ghost"
        color="neutral"
        size="xl"
        aria-label="Toggle Menu Drawer"
        title="Toggle Menu Drawer"
        @click.stop="changeNavigationDrawer"
      />
      <!-- Center: Page Title -->
      <span class="text-xl font-bold truncate text-white flex-1 min-w-0">
        {{ pageTitle }}
      </span>
      <!-- Right: Status Icons & Settings -->
      <div class="ml-auto flex items-center gap-2">
        <span v-if="dataError" title="Error Loading Tarkov Data">
          <UIcon name="i-mdi-database-alert" class="text-error-500 w-6 h-6" />
        </span>
        <span v-if="dataLoading || hideoutLoading" title="Loading Tarkov Data">
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin text-primary-500 w-6 h-6"
          />
        </span>
        <!-- Game mode quick toggle -->
        <div
          class="hidden sm:flex items-center rounded-md border border-white/15 ring-1 ring-white/10 overflow-hidden bg-surface-900/90"
          role="group"
          aria-label="Toggle game mode"
        >
          <button
            type="button"
            class="px-3 py-1.5 sm:px-3 md:px-3.5 lg:px-4 sm:py-1.5 md:py-1.75 lg:py-2 text-[11px] sm:text-xs md:text-sm lg:text-[15px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-pvp-400 focus:z-10 inline-flex items-center gap-2"
            :class="pvpClasses"
            @click="switchMode(GAME_MODES.PVP)"
          >
            <UIcon name="i-mdi-sword-cross" class="w-4 h-4 md:w-5 md:h-5" />
            PvP
          </button>
          <div class="w-[1.5px] h-9 bg-white/15" aria-hidden="true" />
          <button
            type="button"
            class="px-3 py-1.5 sm:px-3 md:px-3.5 lg:px-4 sm:py-1.5 md:py-1.75 lg:py-2 text-[11px] sm:text-xs md:text-sm lg:text-[15px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-pve-400 focus:z-10 inline-flex items-center gap-2"
            :class="pveClasses"
            @click="switchMode(GAME_MODES.PVE)"
          >
            <UIcon name="i-mdi-account-group" class="w-4 h-4 md:w-5 md:h-5" />
            PvE
          </button>
        </div>
        <div class="hidden sm:flex items-center gap-2">
          <USelectMenu
            v-model="selectedLocale"
            :items="localeItems"
            value-key="value"
            :popper="{ placement: 'bottom-end', strategy: 'fixed' }"
            :ui="selectUi"
            :ui-menu="selectMenuUi"
            class="h-10 px-2 w-auto min-w-0 whitespace-nowrap"
          >
            <template #leading>
              <UIcon name="i-mdi-translate" class="w-4 h-4 text-surface-300" />
            </template>
          </USelectMenu>
        </div>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";
import { useTarkovStore } from "@/stores/tarkov";
import { useMetadataStore } from "@/stores/metadata";
import { usePreferencesStore } from "@/stores/preferences";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { GAME_MODES, type GameMode } from "@/utils/constants";
import { useWindowSize } from "@vueuse/core";
const { t } = useI18n({ useScope: "global" });
const appStore = useAppStore();
const tarkovStore = useTarkovStore();
const metadataStore = useMetadataStore();
const preferencesStore = usePreferencesStore();
const route = useRoute();
const { width } = useWindowSize();
const mdAndDown = computed(() => width.value < 960); // Vuetify md breakpoint is 960px
const navBarIcon = computed(() => {
  return appStore.drawerShow && appStore.drawerRail
    ? "i-mdi-menu-open"
    : "i-mdi-menu";
});
const currentGameMode = computed(() => {
  return tarkovStore.getCurrentGameMode();
});
const pveClasses = computed(() =>
  currentGameMode.value === GAME_MODES.PVE
    ? "bg-pve-500 hover:bg-pve-600 text-white shadow-[0_0_0_4px_rgba(0,0,0,0.45)] ring-2 ring-white/60 ring-inset outline outline-2 outline-white/40"
    : "bg-pve-950/80 text-pve-400 hover:bg-pve-900/90"
);
const pvpClasses = computed(() =>
  currentGameMode.value === GAME_MODES.PVP
    ? "bg-pvp-800 hover:bg-pvp-700 text-pvp-100 shadow-[0_0_0_4px_rgba(0,0,0,0.45)] ring-2 ring-white/60 ring-inset outline outline-2 outline-white/40"
    : "bg-pvp-950/80 text-pvp-400 hover:bg-pvp-900/90"
);
async function switchMode(mode: GameMode) {
  if (mode !== currentGameMode.value) {
    await tarkovStore.switchGameMode(mode);
    metadataStore.updateLanguageAndGameMode();
    await metadataStore.fetchAllData();
  }
}
const { loading: dataLoading, hideoutLoading } = storeToRefs(metadataStore);
const dataError = ref(false); // Placeholder - TODO: implement error handling
const pageTitle = computed(() =>
  t(`page.${String(route.name || "index").replace("-", "_")}.title`)
);
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && appStore.drawerShow && mdAndDown.value) {
    event.preventDefault();
    appStore.toggleDrawerShow();
  }
}
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
function changeNavigationDrawer() {
  if (mdAndDown.value) {
    appStore.toggleDrawerShow();
  } else {
    appStore.toggleDrawerRail();
  }
}
const { locale, availableLocales } = useI18n({ useScope: "global" });
const localeItems = computed(() => {
  const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
  return availableLocales.map((localeCode) => ({
    label: languageNames.of(localeCode) || localeCode.toUpperCase(),
    value: localeCode,
  }));
});
const selectedLocale = computed({
  get() {
    return locale.value;
  },
  set(newValue) {
    if (!newValue) return;
    locale.value = newValue;
    // persist in preferences
    preferencesStore.localeOverride = newValue;
    console.log("[AppBar] Setting locale to:", newValue);
    metadataStore.updateLanguageAndGameMode(newValue);
    metadataStore.fetchAllData(true).catch(console.error);
  },
});
// UI configs (shared look with settings page)
const selectUi = {};
const selectMenuUi = {
  container: "z-[9999]",
  width: "w-auto min-w-0",
  background: "bg-surface-900",
  shadow: "shadow-xl",
  rounded: "rounded-lg",
  ring: "ring-1 ring-white/10",
  padding: "p-1",
  option: {
    base: "px-3 py-2 text-sm cursor-pointer transition-colors rounded",
    inactive: "text-surface-200 hover:bg-surface-800 hover:text-white",
    active: "bg-surface-800 text-white",
    selected: "bg-primary-500/10 text-primary-100 ring-1 ring-primary-500",
  },
};
</script>

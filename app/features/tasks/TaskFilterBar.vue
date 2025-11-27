<template>
  <div class="space-y-3 mb-6">
    <!-- Primary View Filter: ALL / MAPS / TRADERS (Centered) -->
    <div class="flex justify-center items-center gap-2 bg-[hsl(240,5%,5%)] rounded-lg py-3 px-4">
      <UButton
        :variant="'ghost'"
        :color="'neutral'"
        size="md"
        :class="{ 'border-b-2 border-primary-500 rounded-none': primaryView === 'all' }"
        @click="setPrimaryView('all')"
      >
        <UIcon name="i-mdi-checkbox-multiple-marked" class="w-5 h-5 mr-2" />
        {{ t("page.tasks.primaryviews.all").toUpperCase() }}
      </UButton>

      <UButton
        :variant="'ghost'"
        :color="'neutral'"
        size="md"
        :class="{ 'border-b-2 border-primary-500 rounded-none': primaryView === 'maps' }"
        @click="setPrimaryView('maps')"
      >
        <UIcon name="i-mdi-map" class="w-5 h-5 mr-2" />
        {{ t("page.tasks.primaryviews.maps").toUpperCase() }}
      </UButton>

      <UButton
        :variant="'ghost'"
        :color="'neutral'"
        size="md"
        :class="{ 'border-b-2 border-primary-500 rounded-none': primaryView === 'traders' }"
        @click="setPrimaryView('traders')"
      >
        <UIcon name="i-mdi-account-group" class="w-5 h-5 mr-2" />
        {{ t("page.tasks.primaryviews.traders").toUpperCase() }}
      </UButton>
    </div>

    <!-- Secondary filters container - responsive stacking -->
    <div class="flex flex-wrap gap-3 w-full">
      <!-- Section 1: Status filters (AVAILABLE / LOCKED / COMPLETED) - minimal width -->
      <div class="flex items-center gap-2 bg-[hsl(240,5%,5%)] rounded-lg py-3 px-4 w-auto">
        <UButton
          :variant="'ghost'"
          :color="'neutral'"
          size="sm"
          :class="{ 'border-b-2 border-primary-500 rounded-none': secondaryView === 'available' }"
          @click="setSecondaryView('available')"
        >
          <UIcon name="i-mdi-clipboard-text" class="w-4 h-4 mr-1" />
          {{ t("page.tasks.secondaryviews.available").toUpperCase() }}
          <span class="ml-2 inline-flex items-center justify-center min-w-7 h-7 px-1.5 text-sm font-bold text-white bg-primary-500 rounded-full">
            {{ statusCounts.available }}
          </span>
        </UButton>

        <UButton
          :variant="'ghost'"
          :color="'neutral'"
          size="sm"
          :class="{ 'border-b-2 border-primary-500 rounded-none': secondaryView === 'locked' }"
          @click="setSecondaryView('locked')"
        >
          <UIcon name="i-mdi-lock" class="w-4 h-4 mr-1" />
          {{ t("page.tasks.secondaryviews.locked").toUpperCase() }}
          <span
            class="ml-2 inline-flex items-center justify-center min-w-7 h-7 px-1.5 text-sm font-bold text-white bg-gray-600 rounded-full"
          >
            {{ statusCounts.locked }}
          </span>
        </UButton>

        <UButton
          :variant="'ghost'"
          :color="'neutral'"
          size="sm"
          :class="{ 'border-b-2 border-primary-500 rounded-none': secondaryView === 'completed' }"
          @click="setSecondaryView('completed')"
        >
          <UIcon name="i-mdi-check-circle" class="w-4 h-4 mr-1" />
          {{ t("page.tasks.secondaryviews.completed").toUpperCase() }}
          <span
            class="ml-2 inline-flex items-center justify-center min-w-7 h-7 px-1.5 text-sm font-bold text-white bg-green-600 rounded-full"
          >
            {{ statusCounts.completed }}
          </span>
        </UButton>
      </div>

      <!-- Section 2: Player/Team view buttons - grows to fill space -->
      <div class="flex items-center justify-center gap-2 bg-[hsl(240,5%,5%)] rounded-lg py-3 px-4 flex-1">
        <UButton
          :variant="'ghost'"
          :color="'neutral'"
          size="sm"
          :class="{ 'border-b-2 border-primary-500 rounded-none': preferencesStore.getTaskUserView === 'self' }"
          @click="onUserViewSelect({ label: t('page.tasks.userviews.yourself'), value: 'self' })"
        >
          <UIcon name="i-mdi-account-outline" class="w-4 h-4 mr-1" />
          {{ t("page.tasks.userviews.yourself").toUpperCase() }}
        </UButton>

        <UButton
          :variant="'ghost'"
          :color="'neutral'"
          size="sm"
          :class="{ 'border-b-2 border-primary-500 rounded-none': preferencesStore.getTaskUserView === 'all' }"
          @click="onUserViewSelect({ label: t('page.tasks.userviews.all'), value: 'all' })"
        >
          <UIcon name="i-mdi-account-multiple" class="w-4 h-4 mr-1" />
          {{ t("page.tasks.userviews.all").toUpperCase() }}
        </UButton>
      </div>

      <!-- Section 3: Settings button - fixed width -->
      <div class="flex items-center bg-[hsl(240,5%,5%)] rounded-lg py-3 px-4 w-auto">
        <UButton
          :variant="'ghost'"
          :color="'neutral'"
          size="sm"
        >
          <UIcon name="i-mdi-tune" class="w-4 h-4 mr-1" />
          TASK SETTINGS
        </UButton>
      </div>
    </div>

    <!-- Map selector (shown when MAPS is selected) -->
    <div v-if="primaryView === 'maps' && maps.length > 0" class="flex justify-center">
      <USelectMenu
        :model-value="selectedMapObject"
        :items="mapOptions"
        class="min-w-[200px]"
        size="md"
        @update:model-value="onMapSelect"
      >
        <template #leading>
          <UIcon name="i-mdi-map-marker" class="w-5 h-5" />
        </template>
      </USelectMenu>
    </div>

    <!-- Trader selector (shown when TRADERS is selected) - Horizontal scrollable -->
    <div v-if="primaryView === 'traders' && traders.length > 0" class="w-full overflow-x-auto">
      <div class="flex gap-3 px-2 py-2 bg-[hsl(240,5%,5%)] rounded-lg justify-center">
        <button
          v-for="trader in traders"
          :key="trader.id"
          @click="onTraderSelect({ label: trader.name, value: trader.id })"
          :class="[
            'flex flex-col items-center justify-center gap-2 px-3 py-3 rounded-lg transition-all',
            'w-28 relative',
            'hover:bg-white/5',
            preferencesStore.getTaskTraderView === trader.id
              ? 'bg-white/10 border-b-2 border-primary-500'
              : 'border-b-2 border-transparent'
          ]"
        >
          <div class="relative">
            <img
              v-if="trader.imageLink"
              :src="trader.imageLink"
              :alt="trader.name"
              class="w-12 h-12 rounded-full object-cover bg-gray-800"
            />
            <UIcon v-else name="i-mdi-account-circle" class="w-12 h-12 text-gray-400" />
            <span
              :class="[
                'absolute -top-1 -right-1 inline-flex items-center justify-center min-w-6 h-6 px-1 text-sm font-bold text-white rounded-full border-2 border-[hsl(240,5%,5%)]',
                (traderCounts[trader.id] ?? 0) > 0 ? 'bg-primary-500' : 'bg-gray-600'
              ]"
            >
              {{ traderCounts[trader.id] ?? 0 }}
            </span>
          </div>
          <span class="text-xs font-medium text-gray-300 whitespace-nowrap">{{ trader.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { usePreferencesStore } from "@/stores/preferences";
import { useMetadataStore } from "@/stores/metadata";
import { useTaskFiltering } from "@/composables/useTaskFiltering";

const { t } = useI18n({ useScope: "global" });
const preferencesStore = usePreferencesStore();
const metadataStore = useMetadataStore();
const { calculateStatusCounts, calculateTraderCounts } = useTaskFiltering();

const maps = computed(() => metadataStore.maps);
const traders = computed(() => metadataStore.traders);

// Calculate task counts for badges
const statusCounts = computed(() => {
  const userView = preferencesStore.getTaskUserView;
  return calculateStatusCounts(userView);
});

const traderCounts = computed(() => {
  const userView = preferencesStore.getTaskUserView;
  return calculateTraderCounts(userView);
});

// Primary view (all / maps / traders)
const primaryView = computed(() => preferencesStore.getTaskPrimaryView);

const setPrimaryView = (view: string) => {
  preferencesStore.setTaskPrimaryView(view);

  // When switching to maps, ensure a map is selected
  if (
    view === "maps" &&
    maps.value.length > 0 &&
    preferencesStore.getTaskMapView === "all"
  ) {
    const firstMap = maps.value[0];
    if (firstMap?.id) {
      preferencesStore.setTaskMapView(firstMap.id);
    }
  }

  // When switching to traders, ensure a trader is selected
  if (
    view === "traders" &&
    traders.value.length > 0 &&
    preferencesStore.getTaskTraderView === "all"
  ) {
    const firstTrader = traders.value[0];
    if (firstTrader?.id) {
      preferencesStore.setTaskTraderView(firstTrader.id);
    }
  }
};

// Secondary view (available / locked / completed)
const secondaryView = computed(() => preferencesStore.getTaskSecondaryView);

const setSecondaryView = (view: string) => {
  preferencesStore.setTaskSecondaryView(view);
};

// Map selection
const mapOptions = computed(() => {
  return maps.value.map((map) => ({
    label: map.name,
    value: map.id,
  }));
});

const selectedMapObject = computed(() => {
  const currentMapId = preferencesStore.getTaskMapView;
  return (
    mapOptions.value.find((option) => option.value === currentMapId) ||
    mapOptions.value[0]
  );
});

const onMapSelect = (selected: { label: string; value: string }) => {
  if (selected?.value) {
    preferencesStore.setTaskMapView(selected.value);
  }
};

// Trader selection
const onTraderSelect = (selected: { label: string; value: string }) => {
  if (selected?.value) {
    preferencesStore.setTaskTraderView(selected.value);
  }
};

// User view selection (yourself / all team members)
const onUserViewSelect = (selected: { label: string; value: string }) => {
  if (selected?.value) {
    preferencesStore.setTaskUserView(selected.value);
  }
};
</script>
<template>
  <div v-if="show" class="w-full my-1">
    <UAccordion
      :items="[{ label: 'Objective Locations', slot: 'content' }]"
      class="w-full"
    >
      <template #default="{ item, open }">
        <UButton
          color="neutral"
          variant="ghost"
          class="w-full flex justify-between items-center py-2 rounded-none sm:p-3"
        >
          <span class="text-base font-medium text-gray-200">
            {{ item.label }}
            <span
              v-show="activeMapView !== '55f2d3fd4bdc2d5f408b4567'"
              class="text-gray-400 font-normal"
            >
              &nbsp;-&nbsp;{{ tarkovTime }}
            </span>
          </span>
          <UIcon
            name="i-mdi-chevron-down"
            class="w-5 h-5 transition-transform duration-200"
            :class="[open && 'transform rotate-180']"
          />
        </UButton>
      </template>
      <template #content>
        <div class="p-4 bg-gray-900/50">
          <tarkov-map
            v-if="selectedMap"
            :map="selectedMap"
            :marks="visibleMarks"
          />
          <UAlert
            v-else
            icon="i-mdi-alert-circle"
            color="error"
            variant="soft"
            title="No map data available for this selection."
          />
        </div>
      </template>
    </UAccordion>
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent, computed } from "vue";
import { useTarkovTime } from "~/composables/useTarkovTime";
import type { TarkovMap } from "~/types/tarkov";
const TarkovMap = defineAsyncComponent(
  () => import("~/features/maps/TarkovMap.vue")
);
// Use structural types compatible with TarkovMap's expectations
interface Props {
  show: boolean;
  selectedMap?: TarkovMap;
  visibleMarkers: Array<{
    zones: Array<{ map: { id: string }; outline: { x: number; z: number }[] }>;
    possibleLocations?: Array<{ map: { id: string }; [key: string]: unknown }>;
  }>;
  activeMapView: string;
}
const props = defineProps<Props>();
const { tarkovTime } = useTarkovTime();
// Alias for better readability in template
const visibleMarks = computed(() => props.visibleMarkers);
</script>

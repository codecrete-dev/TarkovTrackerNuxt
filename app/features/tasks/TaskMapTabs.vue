<template>
  <div v-if="show" class="w-full mb-2">
    <div class="bg-accent-800 rounded-lg shadow-sm border border-surface-700">
      <UTabs
        :items="tabItems"
        :model-value="selectedTabIndex"
        class="w-full"
        @update:model-value="onTabChange"
      >
        <template #default="{ item, index }">
          <div class="flex items-center gap-2 relative px-2 py-1">
            <UIcon name="i-mdi-compass" class="w-4 h-4" />
            <span>{{ item.label }}</span>
            <UBadge
              v-if="item.count > 0"
              :color="index === selectedTabIndex ? 'primary' : 'neutral'"
              variant="solid"
              size="xs"
              class="ml-1 rounded-full"
            >
              {{ item.count }}
            </UBadge>
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
interface MapData {
  id: string;
  name: string;
  mergedIds?: string[];
}
interface Props {
  show: boolean;
  maps: MapData[];
  taskTotals: Record<string, number>;
  activeMapView: string;
}
interface Emits {
  (e: "update:activeMapView", value: string): void;
}
const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const getTaskTotal = (map: MapData): number => {
  const mapId = map.mergedIds?.[0] ?? map.id;
  return (mapId && props.taskTotals[mapId]) || 0;
};
const tabItems = computed(() => {
  return props.maps.map((map) => ({
    label: map.name,
    id: (map.mergedIds?.[0] || map.id) as string,
    count: getTaskTotal(map),
  }));
});
const selectedTabIndex = computed(() => {
  return tabItems.value.findIndex((item) => item.id === props.activeMapView);
});
const onTabChange = (val: string | number) => {
  const index = Number(val);
  const item = tabItems.value[index];
  if (item) {
    emit("update:activeMapView", item.id);
  }
};
</script>

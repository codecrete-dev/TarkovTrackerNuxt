<template>
  <div class="flex h-full flex-col rounded-lg border border-base bg-surface-elevated shadow-sm">
    <!-- Top section: Image + Name side by side -->
    <div class="flex items-center gap-3 p-3">
      <!-- Item image -->
      <div class="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-base">
        <GameItem
          :src="groupedItem.item.image512pxLink || groupedItem.item.iconLink"
          :item-name="groupedItem.item.name"
          :wiki-link="groupedItem.item.wikiLink"
          :dev-link="groupedItem.item.link"
          :is-visible="true"
          :background-color="groupedItem.item.backgroundColor || 'grey'"
          size="small"
          simple-mode
          fill
          class="h-full w-full"
        />
      </div>
      <!-- Item name + Total -->
      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 items-start gap-1">
          <div class="line-clamp-2 min-w-0 text-sm leading-tight font-semibold text-content-primary">
            {{ groupedItem.item.name }}
          </div>
          <AppTooltip v-if="isCraftable" :text="craftableTitle">
            <button type="button" class="inline-flex" @click.stop="goToCraftStation">
              <UIcon name="i-mdi-hammer-wrench" class="h-4 w-4 opacity-90" :class="craftableIconClass" />
            </button>
          </AppTooltip>
        </div>
        <div class="mt-1 flex items-center gap-1">
          <span class="text-xs text-content-tertiary">Total:</span>
          <span class="text-primary-400 text-lg font-bold">
            {{ formatCompactNumber(groupedItem.total) }}
          </span>
        </div>
      </div>
    </div>
    <!-- Breakdown grid -->
    <div class="grid grid-cols-2 divide-x divide-base border-t border-base text-xs">
      <!-- Tasks section -->
      <div class="p-2">
        <div class="mb-1.5 flex items-center gap-1 text-content-tertiary">
          <UIcon name="i-mdi-clipboard-list" class="h-3.5 w-3.5" />
          <span class="font-medium">Tasks</span>
        </div>
        <div class="flex gap-3">
          <div v-if="groupedItem.taskFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-marked-circle" class="text-success-400 h-3 w-3" />
            <span class="text-success-400 font-semibold">{{ groupedItem.taskFir }}</span>
          </div>
          <div v-if="groupedItem.taskNonFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-blank-circle-outline" class="h-3 w-3 text-content-tertiary" />
            <span class="font-semibold text-content-primary">{{ groupedItem.taskNonFir }}</span>
          </div>
          <span
            v-if="groupedItem.taskFir === 0 && groupedItem.taskNonFir === 0"
            class="text-content-tertiary"
          >
            -
          </span>
        </div>
      </div>
      <!-- Hideout section -->
      <div class="p-2">
        <div class="mb-1.5 flex items-center gap-1 text-content-tertiary">
          <UIcon name="i-mdi-home" class="h-3.5 w-3.5" />
          <span class="font-medium">Hideout</span>
        </div>
        <div class="flex gap-3">
          <div v-if="groupedItem.hideoutFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-marked-circle" class="text-success-400 h-3 w-3" />
            <span class="text-success-400 font-semibold">{{ groupedItem.hideoutFir }}</span>
          </div>
          <div v-if="groupedItem.hideoutNonFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-blank-circle-outline" class="h-3 w-3 text-content-tertiary" />
            <span class="font-semibold text-content-primary">{{ groupedItem.hideoutNonFir }}</span>
          </div>
          <span
            v-if="groupedItem.hideoutFir === 0 && groupedItem.hideoutNonFir === 0"
            class="text-content-tertiary"
          >
            -
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useCraftableItem } from '@/composables/useCraftableItem';
  import { formatCompactNumber } from '@/utils/formatters';
  interface GroupedItem {
    itemId: string;
    item: {
      id: string;
      name: string;
      iconLink?: string;
      image512pxLink?: string;
      wikiLink?: string;
      link?: string;
      backgroundColor?: string;
    };
    taskFir: number;
    taskNonFir: number;
    hideoutFir: number;
    hideoutNonFir: number;
    total: number;
  }
  const props = defineProps<{
    groupedItem: GroupedItem;
  }>();
  const itemId = computed(() => props.groupedItem.itemId);
  const { isCraftable, craftableIconClass, craftableTitle, goToCraftStation } =
    useCraftableItem(itemId);
</script>

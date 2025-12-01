<template>
  <div class="container mx-auto space-y-6 p-4">
    <div v-if="loading" class="flex justify-center p-12">
      <UIcon name="i-heroicons-arrow-path" class="text-primary-500 animate-spin text-4xl" />
    </div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <TraderCard
        v-for="trader in sortedTraders"
        :key="trader.id"
        :trader="trader"
        :level="tarkovStore.getTraderLevel(trader.id)"
        :reputation="tarkovStore.getTraderReputation(trader.id)"
        @update:level="(l) => updateLevel(trader.id, l)"
        @update:reputation="(r) => updateReputation(trader.id, r)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
  import { storeToRefs } from 'pinia';
import TraderCard from '@/features/traders/TraderCard.vue';
import { useMetadataStore } from '@/stores/useMetadata';
import { useTarkovStore } from '@/stores/useTarkov';
  const tarkovStore = useTarkovStore();
  const metadataStore = useMetadataStore();
  const { sortedTraders, loading } = storeToRefs(metadataStore);
  const updateLevel = (traderId: string, level: number) => {
    tarkovStore.setTraderLevel(traderId, level);
  };
  const updateReputation = (traderId: string, reputation: number) => {
    tarkovStore.setTraderReputation(traderId, reputation);
  };
</script>

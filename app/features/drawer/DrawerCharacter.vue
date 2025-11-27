<template>
  <div
    v-if="!isCollapsed && !mdAndDown"
    class="flex flex-col gap-2 my-4 px-4 items-center"
  >
    <!-- Edition Button -->
    <button
      class="text-xs font-medium text-white/80 border border-primary-800/50 rounded px-2 py-1 hover:border-primary-600 hover:text-white transition-colors w-full text-center"
      @click="navigateToSettings"
    >
      {{ getEditionName(tarkovStore.gameEdition) }}
    </button>

    <!-- Faction Toggle -->
    <div class="flex w-full rounded-md border border-primary-800/50 overflow-hidden">
      <button
        v-for="faction in factions"
        :key="faction"
        class="flex-1 px-2 py-1 text-xs font-semibold uppercase transition-colors"
        :class="
          faction === currentFaction
            ? 'bg-primary-700 text-white'
            : 'bg-transparent text-white/65 hover:text-white hover:bg-white/5'
        "
        @click="setFaction(faction)"
      >
        {{ faction }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTarkovStore } from "@/stores/tarkov";
import { getEditionName, PMC_FACTIONS } from "@/utils/constants";
import { useBreakpoints } from "@vueuse/core";
import { useRouter } from "vue-router";
import { computed } from "vue";

defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});

const tarkovStore = useTarkovStore();
const factions = PMC_FACTIONS;
const router = useRouter();
const breakpoints = useBreakpoints({
  mobile: 0,
  md: 960,
});
const mdAndDown = breakpoints.smaller("md");

function navigateToSettings() {
  router.push("/settings");
}

const currentFaction = computed(() => tarkovStore.getPMCFaction());
function setFaction(faction: "USEC" | "BEAR") {
  if (faction !== currentFaction.value) {
    tarkovStore.setPMCFaction(faction);
  }
}
</script>

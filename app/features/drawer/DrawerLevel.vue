<template>
  <div class="flex justify-center items-center py-2 px-3">
    <template v-if="isCollapsed">
      <div class="text-center">
        <div class="text-[0.7em] mb-1 text-gray-400">
          {{ t("navigation_drawer.level") }}
        </div>
        <h1 class="text-2xl font-bold text-center leading-tight">
          {{ tarkovStore.playerLevel() }}
        </h1>
      </div>
    </template>
    <template v-else>
      <!-- Card container for expanded state -->
      <div class="w-full bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm px-2.5 py-2">
        <div class="flex items-center gap-1">
          <span v-if="!mdAndDown" class="leading-none mr-1.5">
            <div class="relative w-14 h-14 overflow-hidden group">
              <NuxtImg
                :src="pmcFactionIcon"
                class="absolute top-0 left-0 z-20 opacity-0 mt-1.5 px-1.5 transition-opacity duration-1000 ease-in-out invert group-hover:opacity-100 max-w-[56px]"
                width="56"
                height="56"
              />
              <NuxtImg
                :src="groupIcon"
                class="absolute top-0 left-0 z-10 opacity-100 transition-opacity duration-1000 ease-in-out group-hover:opacity-0 max-w-[56px]"
                width="56"
                height="56"
              />
            </div>
          </span>
          <span class="mx-0.5">
            <div class="text-[0.65em] text-center mb-0.5 text-gray-300">
              {{ t("navigation_drawer.level") }}
            </div>
            <div class="text-center">
              <h1
                v-if="!editingLevel"
                class="text-[2.2em] w-[2.2em] leading-[0.85em] cursor-pointer hover:text-primary transition-colors"
                @click="startEditingLevel"
              >
                {{ tarkovStore.playerLevel() }}
              </h1>
              <input
                v-else
                ref="levelInput"
                v-model.number="levelInputValue"
                type="number"
                :min="minPlayerLevel"
                :max="maxPlayerLevel"
                class="text-[2.2em] w-[2.2em] text-center bg-transparent border-0 outline-none focus:ring-0 focus:outline-none p-0 leading-[0.85em] appearance-none"
                @input="enforceMaxLevel"
                @blur="saveLevel"
                @keyup.enter="saveLevel"
              />
            </div>
          </span>
          <span class="flex flex-col ml-1 gap-1 items-center">
            <button
              class="p-0 text-white/70 hover:text-white flex items-center justify-center w-6 h-6 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="tarkovStore.playerLevel() >= maxPlayerLevel"
              @click="incrementLevel"
            >
              <UIcon name="i-mdi-chevron-up" class="w-5 h-5" />
            </button>
            <template v-if="tarkovStore.playerLevel() > minPlayerLevel">
              <button
                class="p-0 text-white/70 hover:text-white flex items-center justify-center w-6 h-6 transition-colors cursor-pointer"
                @click="decrementLevel"
              >
                <UIcon name="i-mdi-chevron-down" class="w-5 h-5" />
              </button>
            </template>
            <template v-else>
              <div class="w-6 h-6" aria-hidden="true"></div>
            </template>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { computed, ref, nextTick } from "vue";
import { useTarkovStore } from "@/stores/tarkov";
import { useMetadataStore } from "@/stores/metadata";
import { useBreakpoints } from "@vueuse/core";
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "global" });
// Define breakpoints (matching Vuetify's md breakpoint at 960px)
const breakpoints = useBreakpoints({
  mobile: 0,
  md: 960,
});
const mdAndDown = breakpoints.smaller("md");
defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});
const tarkovStore = useTarkovStore();
const metadataStore = useMetadataStore();
const minPlayerLevel = computed(() => metadataStore.minPlayerLevel);
const maxPlayerLevel = computed(() => metadataStore.maxPlayerLevel);
const playerLevels = computed(() => metadataStore.playerLevels);
const pmcFactionIcon = computed(() => {
  return `/img/factions/${tarkovStore.getPMCFaction()}.webp`;
});
const groupIcon = computed(() => {
  const level = tarkovStore.playerLevel();
  const entry = playerLevels.value.find((pl) => pl.level === level);
  return entry?.levelBadgeImageLink ?? "";
});
// Manual level editing logic
const editingLevel = ref(false);
const levelInputValue = ref(tarkovStore.playerLevel());
const levelInput = ref(null);
function startEditingLevel() {
  editingLevel.value = true;
  levelInputValue.value = tarkovStore.playerLevel();
  nextTick(() => {
    if (levelInput.value) levelInput.value.focus();
  });
}
function enforceMaxLevel() {
  const currentValue = parseInt(levelInputValue.value, 10);
  if (!isNaN(currentValue) && currentValue > maxPlayerLevel.value) {
    levelInputValue.value = maxPlayerLevel.value;
  }
}
function saveLevel() {
  let newLevel = parseInt(levelInputValue.value, 10);
  if (isNaN(newLevel)) newLevel = minPlayerLevel.value;
  newLevel = Math.max(
    minPlayerLevel.value,
    Math.min(maxPlayerLevel.value, newLevel)
  );
  tarkovStore.setLevel(newLevel);
  editingLevel.value = false;
}
function incrementLevel() {
  if (tarkovStore.playerLevel() < maxPlayerLevel.value) {
    tarkovStore.setLevel(tarkovStore.playerLevel() + 1);
  }
}
function decrementLevel() {
  if (tarkovStore.playerLevel() > minPlayerLevel.value) {
    tarkovStore.setLevel(tarkovStore.playerLevel() - 1);
  }
}
</script>
<style>
/* Hide spin buttons for number input */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  margin: 0;
}
input[type="number"] {
  appearance: textfield !important;
  -moz-appearance: textfield !important;
}
</style>

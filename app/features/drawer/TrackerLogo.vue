<template>
  <NuxtLink
    to="/"
    class="flex flex-col items-center mt-2 px-3 py-2 group hover:opacity-90 transition-opacity"
  >
    <div
      :class="isCollapsed ? 'w-8' : 'w-[130px]'"
      class="transition-all duration-200 mx-auto"
    >
      <NuxtImg :src="logo" class="w-full h-auto" preload />
    </div>
    <div v-if="!isCollapsed" class="mt-2 text-center">
      <div class="text-base font-medium leading-tight text-white">
        TarkovTracker.org
      </div>
    </div>
  </NuxtLink>
</template>
<script setup>
import { computed } from "vue";
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});
const logo = computed(() => {
  return props.isCollapsed
    ? "/img/logos/tarkovtrackerlogo-mini.webp"
    : "/img/logos/tarkovtrackerlogo-light.webp";
});
</script>

<template>
  <div class="flex justify-between items-center">
    <a
      :href="props.task?.wikiLink"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center text-primary-400 hover:text-primary-300 no-underline"
    >
      <div class="w-12 h-12 rounded-full overflow-hidden mr-2">
        <img :src="traderAvatar" class="w-full h-full object-cover" />
      </div>
      <template v-if="isFactionTask">
        <div class="w-12 h-12 rounded-none ml-2">
          <img
            :src="factionImage"
            class="w-full h-full object-contain invert"
          />
        </div>
      </template>
      <span class="ml-2 font-bold text-xl">
        {{ props.task?.name }}
      </span>
    </a>
    <a
      v-if="props.showWikiLink"
      :href="props.task.wikiLink"
      target="_blank"
      class="text-xs whitespace-nowrap text-primary-400 hover:text-primary-300 flex items-center"
    >
      <UIcon name="i-mdi-information-outline" class="w-6 h-6 mr-1" />
      <span>{{ t("page.tasks.questcard.wiki") }}</span>
    </a>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// Define the props for the component
const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  showWikiLink: {
    type: Boolean,
    required: false,
    default: false,
  },
});
const { t } = useI18n({ useScope: "global" });
// Check if there are two faction tasks for this task
const isFactionTask = computed(() => {
  return props.task?.factionName != "Any";
});
const factionImage = computed(() => {
  return `/img/factions/${props.task.factionName}.webp`;
});
const traderAvatar = computed(() => {
  return props.task?.trader?.imageLink;
});
</script>
<style scoped>
/* Scoped styles removed - using Tailwind classes */
</style>

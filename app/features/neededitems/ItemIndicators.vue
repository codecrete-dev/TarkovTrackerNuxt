<template>
  <AppTooltip v-if="foundInRaid" :text="foundInRaidTitle">
    <UIcon name="i-mdi-checkbox-marked-circle-outline" :class="firIconClass" />
  </AppTooltip>
  <AppTooltip v-if="kappaRequired" :text="kappaTitleText">
    <UIcon name="i-mdi-trophy" :class="kappaIconClass" />
  </AppTooltip>
  <AppTooltip v-if="isCraftable" :text="craftableTitleText">
    <button
      type="button"
      class="inline-flex"
      :aria-label="craftableTitleText"
      @click.stop="emit('craft')"
    >
      <UIcon name="i-mdi-hammer-wrench" :class="[craftableIconBaseClass, craftableIconClass]" />
    </button>
  </AppTooltip>
</template>
<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      craftableIconBaseClass?: string;
      craftableIconClass?: string;
      craftableTitle?: string;
      firIconClass?: string;
      foundInRaid: boolean;
      foundInRaidTitle?: string;
      isCraftable: boolean;
      kappaIconClass?: string;
      kappaRequired?: boolean;
      kappaTitle?: string;
    }>(),
    {
      craftableIconBaseClass: 'ml-1 h-5 w-5',
      craftableIconClass: '',
      craftableTitle: 'Craftable',
      firIconClass: 'ml-1 h-5 w-5',
      foundInRaidTitle: 'Found in Raid required',
      kappaIconClass: 'ml-1 h-5 w-5 text-warning-400',
      kappaRequired: false,
      kappaTitle: 'Required for Kappa quest',
    }
  );
  const emit = defineEmits<{
    craft: [];
  }>();
  // Parents may pass an empty/whitespace string; trim so tooltip/aria-label are never blank.
  const craftableTitleText = computed(() => {
    const title = props.craftableTitle?.trim();
    return title && title.length > 0 ? title : 'Craftable';
  });
  const kappaTitleText = computed(() => {
    const title = props.kappaTitle?.trim();
    return title && title.length > 0 ? title : 'Required for Kappa quest';
  });
</script>

<template>
  <UIcon
    v-if="foundInRaid"
    v-tooltip="foundInRaidTitle"
    name="i-mdi-checkbox-marked-circle-outline"
    :class="firIconClass"
  />
  <button
    v-if="isCraftable"
    v-tooltip="craftableTitleText"
    type="button"
    class="inline-flex"
    :aria-label="craftableTitleText"
    @click.stop="emit('craft')"
  >
    <UIcon name="i-mdi-hammer-wrench" :class="[craftableIconBaseClass, craftableIconClass]" />
  </button>
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
    }>(),
    {
      craftableIconBaseClass: 'ml-1 h-5 w-5',
      craftableIconClass: '',
      craftableTitle: 'Craftable',
      firIconClass: 'ml-1 h-5 w-5',
      foundInRaidTitle: 'Found in Raid required',
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
</script>

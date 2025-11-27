<template>
  <div class="flex items-center">
    <UButton
      variant="ghost"
      color="neutral"
      class="p-0 m-0 min-w-0 cursor-pointer"
      size="sm"
      @click="$emit('decrease')"
    >
      <UIcon name="i-mdi-minus-thick" class="w-5 h-5" />
    </UButton>
    <UButton
      variant="ghost"
      color="neutral"
      class="px-2 mx-1 min-w-0 text-sm font-semibold cursor-pointer"
      size="sm"
      @click="$emit('toggle')"
    >
      {{ currentCount.toLocaleString() }}/{{ neededCount.toLocaleString() }}
    </UButton>
    <UButton
      variant="ghost"
      color="neutral"
      class="p-0 m-0 min-w-0 cursor-pointer"
      size="sm"
      @click="$emit('increase')"
    >
      <UIcon name="i-mdi-plus-thick" class="w-5 h-5" />
    </UButton>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  currentCount: number;
  neededCount: number;
}>();
defineEmits<{
  decrease: [];
  increase: [];
  toggle: [];
}>();
</script>
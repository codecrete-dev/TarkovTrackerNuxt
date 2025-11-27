<template>
  <div
    class="px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 cursor-pointer transition-colors duration-150 flex items-center gap-2"
    @click="handleClick"
  >
    <UIcon v-if="icon" :name="icon" class="w-4 h-4 shrink-0" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  icon?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>

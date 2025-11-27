<template>
  <li>
    <NuxtLink
      v-if="props.to && !props.href"
      :to="props.to"
      class="group flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-150 cursor-pointer"
      :class="[
        isActive
          ? 'bg-surface-700 text-white border-l-2 border-primary-500'
          : 'text-[rgba(248,248,248,0.65)] hover:text-white hover:bg-white/5 border-l-2 border-transparent',
        props.isCollapsed ? 'justify-center' : '',
      ]"
    >
      <!-- Icon / Avatar -->
      <div
        :class="[
          props.isCollapsed ? '' : 'mr-3',
          'shrink-0 flex items-center justify-center w-6',
        ]"
      >
        <template v-if="props.avatar">
          <NuxtImg :src="props.avatar" class="h-6 w-6 rounded-full" width="24" height="24" />
        </template>
        <template v-else-if="props.icon.startsWith('i-')">
          <UIcon
            :name="props.icon"
            class="w-6 h-6 transition-colors"
            :class="iconClasses"
          />
        </template>
        <template v-else>
          <span :class="['mdi', props.icon, 'text-2xl']"></span>
        </template>
      </div>
      <!-- Text -->
      <span
        v-if="!props.isCollapsed"
        class="truncate"
      >
        <template v-if="props.localeKey">
          {{ t(`navigation_drawer.${props.localeKey}`) }}
        </template>
        <template v-else-if="props.text">
          {{ props.text }}
        </template>
      </span>
    </NuxtLink>
    <a
      v-else-if="props.href"
      :href="props.href"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer"
      :class="[
        'text-[rgba(248,248,248,0.65)] hover:text-white hover:bg-white/5 border-l-2 border-transparent',
        props.isCollapsed ? 'justify-center' : '',
      ]"
      @click="visitHref()"
    >
      <!-- Icon / Avatar -->
      <div
        :class="[
          props.isCollapsed ? '' : 'mr-3',
          'shrink-0 flex items-center justify-center w-6',
        ]"
      >
        <template v-if="props.avatar">
          <NuxtImg :src="props.avatar" class="h-6 w-6 rounded-full" width="24" height="24" />
        </template>
        <template v-else-if="props.icon.startsWith('i-')">
          <UIcon :name="props.icon" class="w-6 h-6" :class="props.iconColor ? `text-${props.iconColor}` : ''" />
        </template>
        <template v-else>
          <span :class="['mdi', props.icon, 'text-2xl']"></span>
        </template>
      </div>
      <!-- Text -->
      <span
        v-if="!props.isCollapsed"
        class="truncate"
      >
        <template v-if="props.localeKey">
          {{ t(`navigation_drawer.${props.localeKey}`) }}
        </template>
        <template v-else-if="props.text">
          {{ props.text }}
        </template>
      </span>
    </a>
    <div
      v-else
      class="group flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-200 cursor-pointer text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
      :class="[props.isCollapsed ? 'justify-center' : '']"
    >
      <!-- Icon / Avatar -->
      <div
        :class="[
          props.isCollapsed ? '' : 'mr-3',
          'shrink-0 flex items-center justify-center w-6',
        ]"
      >
        <template v-if="props.avatar">
          <NuxtImg :src="props.avatar" class="h-6 w-6 rounded-full" width="24" height="24" />
        </template>
        <template v-else-if="props.icon.startsWith('i-')">
          <UIcon :name="props.icon" class="w-6 h-6" :class="props.iconColor ? `text-${props.iconColor}` : ''" />
        </template>
        <template v-else>
          <span :class="['mdi', props.icon, 'text-2xl']"></span>
        </template>
      </div>
      <!-- Text -->
      <span
        v-if="!props.isCollapsed"
        class="truncate"
      >
        <template v-if="props.localeKey">
          {{ t(`navigation_drawer.${props.localeKey}`) }}
        </template>
        <template v-else-if="props.text">
          {{ props.text }}
        </template>
      </span>
    </div>
  </li>
</template>
<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
const { t } = useI18n({ useScope: "global" });
const route = useRoute();
const props = defineProps({
  icon: {
    type: String,
    default: "mdi-menu-right",
    required: false,
  },
  avatar: {
    type: String,
    required: false,
    default: null,
  },
  iconColor: {
    type: String,
    required: false,
    default: null,
  },
  localeKey: {
    type: String,
    required: false,
    default: null,
  },
  text: {
    type: String,
    required: false,
    default: null,
  },
  to: {
    type: String,
    required: false,
    default: null,
  },
  href: {
    type: String,
    required: false,
    default: null,
  },
  extLink: {
    type: Boolean,
    required: false,
    default: false,
  },
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});
const isActive = computed(() => {
  if (props.to) {
    return route.path === props.to;
  }
  return false;
});
const iconClasses = computed(() => {
  if (isActive.value) return "text-primary-400";
  if (props.iconColor) return [`text-${props.iconColor}`, "group-hover:text-white"].join(' ');
  return "text-white/70 group-hover:text-white";
});
const visitHref = () => {
  if (props.href !== null) {
    window.open(props.href, "_blank");
  }
};
</script>

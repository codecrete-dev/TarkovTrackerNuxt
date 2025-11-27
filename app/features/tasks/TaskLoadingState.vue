<template>
  <div class="flex flex-col items-center justify-center w-full py-4">
    <div class="flex items-center mb-2">
      <UIcon
        name="i-mdi-loading"
        class="w-6 h-6 animate-spin text-gray-400 mr-2"
      />
      <span class="text-gray-400">{{ t("page.tasks.loading") }}</span>
    </div>
    <refresh-button />
  </div>
</template>
<script setup lang="ts">
import RefreshButton from "@/components/ui/RefreshButton.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "global" });
</script>

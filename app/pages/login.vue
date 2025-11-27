<template>
<div class="min-h-screen flex justify-center items-center bg-surface-950 p-4">
    <UCard
    class="w-full max-w-xl shadow-2xl ring-1 ring-white/10 bg-surface-900"
      :ui="{
        body: 'p-0',
        header: 'p-0',
        footer: 'p-0',
      }"
    >
      <!-- Header Section -->
      <div class="flex flex-col items-center text-center pt-12 px-10 pb-8">
        <tracker-logo class="mb-8 scale-150" :is-collapsed="false" />
        <h1 class="text-4xl font-bold mb-4 text-white tracking-tight">
          {{ $t("page.login.title") }}
        </h1>
        <p class="text-lg text-gray-400">
          {{ $t("page.login.subtitle") }}
        </p>
      </div>

      <!-- Auth Buttons -->
      <div class="px-10 pb-10">
        <auth-buttons />
      </div>

      <!-- Footer Links -->
      <div class="px-8 py-5 border-t border-white/5 bg-black/20 rounded-b-lg">
        <div class="flex justify-between items-center">
          <UButton
            to="/privacy"
            target="_blank"
            variant="ghost"
            color="neutral"
            size="sm"
            class="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {{ $t("page.login.privacy_policy") }}
          </UButton>
          <UButton
            to="/terms"
            target="_blank"
            variant="ghost"
            color="neutral"
            size="sm"
            class="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {{ $t("page.login.terms_of_service") }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
<script setup lang="ts">
import AuthButtons from "@/features/auth/AuthButtons.vue";
import TrackerLogo from "@/features/drawer/TrackerLogo.vue";
</script>
<style scoped>
/* Scoped styles removed as we use Tailwind utility classes */
</style>
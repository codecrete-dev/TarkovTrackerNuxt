<template>
<div class="min-h-screen bg-surface-900 flex items-center justify-center px-4">
    <UCard
      class="w-full max-w-md bg-surface-900 border border-white/10 shadow-2xl"
      :ui="{ body: 'p-8' }"
    >
      <div class="flex flex-col items-center text-center space-y-3">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-10 h-10 text-primary-500 animate-spin"
        />
        <h2 class="text-lg font-semibold text-surface-50">Authenticating...</h2>
        <p class="text-sm text-surface-300">
          Please wait while we complete your sign in.
        </p>
      </div>
    </UCard>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
onMounted(async () => {
  // Check if this is a popup window (has opener)
  const isPopup = window.opener && !window.opener.closed;
  if (isPopup) {
    // Wait for Supabase to process the OAuth hash
    // The Supabase client automatically processes the hash on page load
    // We just need to wait a moment for it to complete
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Send success message to opener window
    window.opener.postMessage(
      { type: "OAUTH_SUCCESS" },
      window.location.origin
    );
    // Close this popup after a short delay to ensure the message is sent
    setTimeout(() => {
      window.close();
    }, 200);
  } else {
    // This is a full redirect (not popup) - redirect to dashboard
    // Wait a moment for the session to be established
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Navigate to dashboard
    await navigateTo("/", { replace: true });
  }
});
</script>

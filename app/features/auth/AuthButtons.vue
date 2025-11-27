<template>
  <div class="w-full space-y-4">
    <UButton
      block
      size="xl"
      variant="solid"
      class="w-full flex justify-center items-center h-12 bg-[#9146FF] hover:bg-[#9146FF]/90 text-white border-none transition-colors"
      :loading="loading.twitch"
      :disabled="loading.twitch || loading.discord"
      @click="signInWithTwitch"
    >
      <UIcon name="i-mdi-twitch" class="mr-3 w-6 h-6 text-white shrink-0" />
      <span class="text-white font-medium whitespace-nowrap">{{
        $t("page.login.continue_twitch")
      }}</span>
    </UButton>

    <UButton
      block
      size="xl"
      variant="solid"
      class="w-full flex justify-center items-center h-12 bg-[#5865F2] hover:bg-[#5865F2]/90 text-white border-none transition-colors"
      :loading="loading.discord"
      :disabled="loading.twitch || loading.discord"
      @click="signInWithDiscord"
    >
      <UIcon name="i-mdi-controller" class="mr-3 w-6 h-6 text-white shrink-0" />
      <span class="text-white font-medium whitespace-nowrap">{{
        $t("page.login.continue_discord")
      }}</span>
    </UButton>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import DataMigrationService from "@/utils/DataMigrationService";
const { $supabase } = useNuxtApp();
const loading = ref({
  google: false, // Kept for compatibility if needed, but we'll use Twitch/Discord
  github: false,
  twitch: false,
  discord: false,
});
const hasLocalData = ref(false);
// Prevent automatic navigation after login - we'll handle it manually
onMounted(async () => {
  try {
    // Wait for Vue to finish initial rendering and give Pinia time to initialize
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Check for local data
    hasLocalData.value = DataMigrationService.hasLocalData();
  } catch (error) {
    console.error("Error in onMounted:", error);
  }
});
const signInWithTwitch = async () => {
  try {
    loading.value.twitch = true;

    const config = useRuntimeConfig();
    const callbackUrl = `${config.public.appUrl}/auth/callback`;

    // Get OAuth URL - we'll handle redirect in a popup
    const data = await $supabase.signInWithOAuth("twitch", {
      skipBrowserRedirect: true,
      redirectTo: callbackUrl,
    });

    if (data?.url) {
      // Open popup window with specific features for OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        data.url,
        "oauth-popup",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
      );

      if (popup) {
        // Listen for messages from popup
        const messageHandler = (event: MessageEvent) => {
          if (
            event.origin === window.location.origin &&
            event.data?.type === "OAUTH_SUCCESS"
          ) {
            // Authentication successful - existing onAuthStateChange listener will handle session update
            loading.value.twitch = false;
            cleanup();
          }
        };

        // Poll for popup closure
        const pollTimer = setInterval(() => {
          if (popup.closed) {
            // User closed popup without authenticating
            loading.value.twitch = false;
            cleanup();
          }
        }, 500);
        const cleanup = () => {
          clearInterval(pollTimer);
          window.removeEventListener("message", messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
        };
        window.addEventListener("message", messageHandler);
      } else {
        // Popup blocked - fallback to redirect
        console.warn("Popup was blocked, falling back to redirect");
        loading.value.twitch = false;
        alert("Please allow popups for this site to use OAuth authentication.");
      }
    }
  } catch (error) {
    console.error("Twitch sign in error:", error);
    loading.value.twitch = false;
  }
};
const signInWithDiscord = async () => {
  try {
    loading.value.discord = true;

    const config = useRuntimeConfig();
    const callbackUrl = `${config.public.appUrl}/auth/callback`;

    // Get OAuth URL - we'll handle redirect in a popup
    const data = await $supabase.signInWithOAuth("discord", {
      skipBrowserRedirect: true,
      redirectTo: callbackUrl,
    });
    if (data?.url) {
      // Open popup window with specific features for OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        data.url,
        "oauth-popup",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
      );
      if (popup) {
        // Listen for messages from popup
        const messageHandler = (event: MessageEvent) => {
          if (
            event.origin === window.location.origin &&
            event.data?.type === "OAUTH_SUCCESS"
          ) {
            // Authentication successful - existing onAuthStateChange listener will handle session update
            loading.value.discord = false;
            cleanup();
          }
        };

        // Poll for popup closure
        const pollTimer = setInterval(() => {
          if (popup.closed) {
            // User closed popup without authenticating
            loading.value.discord = false;
            cleanup();
          }
        }, 500);
        const cleanup = () => {
          clearInterval(pollTimer);
          window.removeEventListener("message", messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
        };
        window.addEventListener("message", messageHandler);
      } else {
        // Popup blocked - fallback to redirect
        console.warn("Popup was blocked, falling back to redirect");
        loading.value.discord = false;
        alert("Please allow popups for this site to use OAuth authentication.");
      }
    }
  } catch (error) {
    console.error("Discord sign in error:", error);
    loading.value.discord = false;
  }
};
</script>
<style scoped>
/* Custom styles removed - using Tailwind classes */
</style>

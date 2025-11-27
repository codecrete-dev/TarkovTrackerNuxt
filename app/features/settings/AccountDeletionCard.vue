<template>
  <div class="account-deletion-card" :class="$attrs.class">
    <GenericCard
      icon="mdi-account-cog"
      icon-color="red-500"
      highlight-color="red"
    >
      <template #title>
        <span class="text-red-500 text-xl font-bold">Account Management</span>
      </template>
      <template #content>
        <div class="p-4">
          <!-- Account Information (Moved to Top) -->
          <div
            class="mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/50"
          >
            <div class="text-base font-bold mb-3">Account Information</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div class="flex items-center mb-2">
                  <UIcon
                    name="i-mdi-account"
                    class="mr-2 w-4.5 h-4.5 text-gray-400"
                  />
                  <span class="text-sm">
                    <span class="text-gray-400">Username:</span>
                    <span class="font-medium ml-1">{{
                      $supabase.user.username || "N/A"
                    }}</span>
                  </span>
                </div>
                <div class="flex items-center mb-2">
                  <UIcon
                    name="i-mdi-email"
                    class="mr-2 w-4.5 h-4.5 text-gray-400"
                  />
                  <span class="text-sm">
                    <span class="text-gray-400">Email:</span>
                    <span class="font-medium ml-1">{{
                      $supabase.user.email || "N/A"
                    }}</span>
                  </span>
                </div>
              </div>
              <div>
                <div class="flex items-center mb-2">
                  <UIcon
                    name="i-mdi-login"
                    class="mr-2 w-4.5 h-4.5 text-gray-400"
                  />
                  <span class="text-sm flex items-center">
                    <span class="text-gray-400 mr-2">Auth Method:</span>
                    <UBadge
                      size="xs"
                      :color="
                        $supabase.user.provider === 'discord'
                          ? 'indigo'
                          : 'purple'
                      "
                      variant="solid"
                      class="text-white"
                    >
                      <UIcon
                        :name="
                          $supabase.user.provider === 'discord'
                            ? 'i-mdi-discord'
                            : 'i-mdi-twitch'
                        "
                        class="mr-1 w-4 h-4"
                      />
                      {{
                        $supabase.user.provider
                          ? $supabase.user.provider.charAt(0).toUpperCase() +
                            $supabase.user.provider.slice(1)
                          : "Unknown"
                      }}
                    </UBadge>
                  </span>
                </div>
                <div class="flex items-center">
                  <UIcon
                    name="i-mdi-calendar"
                    class="mr-2 w-4.5 h-4.5 text-gray-400"
                  />
                  <span class="text-sm">
                    <span class="text-gray-400">Member since:</span>
                    <span class="font-medium ml-1">{{
                      formatDate($supabase.user.createdAt)
                    }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="my-3 border-t border-gray-700"></div>
            <div class="flex items-center">
              <UIcon
                name="i-mdi-identifier"
                class="mr-2 w-4.5 h-4.5 text-gray-400"
              />
              <span class="text-sm text-gray-400 mr-2">Account ID:</span>
              <code class="text-xs bg-gray-700 px-2 py-1 rounded">{{
                $supabase.user.id
              }}</code>
              <UTooltip :text="accountIdCopied ? 'Copied!' : 'Copy Account ID'">
                <UButton
                  size="xs"
                  variant="ghost"
                  :icon="accountIdCopied ? 'i-mdi-check' : 'i-mdi-content-copy'"
                  :color="accountIdCopied ? 'green' : 'primary'"
                  class="ml-1"
                  @click="copyAccountId"
                />
              </UTooltip>
            </div>
          </div>
          <!-- Deletion Warning -->
          <UAlert
            icon="i-mdi-alert-circle"
            color="red"
            variant="soft"
            class="mb-4"
            title="Permanent Account Deletion"
          >
            <template #description>
              <div class="text-sm mb-2">
                This action cannot be undone. All your data will be permanently
                deleted.
              </div>
              <ul class="text-sm ml-4 mb-3 list-disc">
                <li>Your progress tracking data</li>
                <li>Team memberships and owned teams</li>
                <li>API tokens and settings</li>
                <li>All personal information</li>
              </ul>
              <div class="text-sm font-bold">
                This does <span class="underline">not</span> affect your Escape
                from Tarkov account, only Tarkov Tracker data.
              </div>
            </template>
          </UAlert>
          <UAlert
            v-if="hasOwnedTeams"
            icon="i-mdi-account-group"
            color="orange"
            variant="soft"
            class="mb-4"
            title="Team Ownership Transfer"
          >
            <template #description>
              <div class="text-sm">
                You own {{ ownedTeamsCount }} team(s). Team ownership will be
                automatically transferred to the oldest member in each team.
                Teams without other members will be deleted.
              </div>
            </template>
          </UAlert>
          <div class="text-center mt-6">
            <UButton
              color="red"
              variant="solid"
              size="lg"
              icon="i-mdi-delete-forever"
              :loading="isDeleting"
              :disabled="isDeleting"
              @click="showConfirmationDialog = true"
            >
              Begin Account Deletion
            </UButton>
          </div>
        </div>
      </template>
    </GenericCard>
  </div>
  <UModal v-model="showConfirmationDialog" prevent-close>
    <UCard>
      <template #header>
        <div
          class="text-xl font-medium px-4 py-3 text-red-500 flex items-center"
        >
          <UIcon name="i-mdi-alert-circle" class="mr-2 w-6 h-6 text-red-500" />
          Confirm Account Deletion
        </div>
      </template>
      <div class="px-4 pb-4">
        <UAlert
          color="red"
          variant="solid"
          class="mb-4"
          title="This action is irreversible!"
          description="All your data will be permanently deleted and cannot be recovered."
        />
        <div class="mb-4">
          <div class="text-base font-medium mb-2">Security Confirmation</div>
          <div class="text-sm text-gray-400 mb-3">
            Account deletion requires typing the exact confirmation phrase
            below. This action is permanent and cannot be undone.
          </div>
        </div>
        <div class="mb-4">
          <div class="text-base font-medium mb-2">
            Type "DELETE MY ACCOUNT" to confirm:
          </div>
          <UInput
            v-model="confirmationText"
            placeholder="DELETE MY ACCOUNT"
            :color="confirmationError ? 'red' : 'white'"
            @input="confirmationError = false"
          />
          <div v-if="confirmationError" class="text-red-500 text-xs mt-1">
            Please type exactly: DELETE MY ACCOUNT
          </div>
        </div>
        <UAlert
          v-if="deleteError"
          color="red"
          variant="soft"
          class="mb-4"
          :title="deleteError"
        />
      </div>
      <template #footer>
        <div class="flex justify-end px-4 pb-4">
          <UButton
            variant="ghost"
            color="gray"
            :disabled="isDeleting"
            @click="closeDialog"
          >
            Cancel
          </UButton>
          <UButton
            color="red"
            variant="solid"
            :loading="isDeleting"
            :disabled="!canDelete || isDeleting"
            class="ml-3"
            @click="deleteAccount"
          >
            Delete Account Forever
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
  <UModal v-model="showSuccessDialog" prevent-close>
    <UCard>
      <template #header>
        <div
          class="text-xl font-medium px-4 py-3 text-green-500 flex items-center"
        >
          <UIcon
            name="i-mdi-check-circle"
            class="mr-2 w-6 h-6 text-green-500"
          />
          Account Deleted Successfully
        </div>
      </template>
      <div class="px-4 pb-4">
        <div class="text-base mb-3">
          Your account and all associated data have been permanently deleted.
        </div>
        <div class="text-sm text-gray-400">
          Thank you for using TarkovTracker. You will be redirected to the
          dashboard.
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end px-4 pb-4">
          <UButton color="primary" variant="solid" @click="redirectToHome">
            Go to Dashboard
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useTeamStoreWithSupabase } from "@/stores/useTeamStore";
import GenericCard from "@/components/ui/GenericCard.vue";
defineOptions({
  inheritAttrs: false,
});
const { $supabase } = useNuxtApp();
const router = useRouter();
const { teamStore } = useTeamStoreWithSupabase();
const showConfirmationDialog = ref(false);
const showSuccessDialog = ref(false);
const confirmationText = ref("");
const confirmationError = ref(false);
const deleteError = ref("");
const isDeleting = ref(false);
const accountIdCopied = ref(false);
const hasOwnedTeams = computed(() => {
  return (
    teamStore.$state.team && teamStore.$state.team.owner === $supabase.user.id
  );
});
const ownedTeamsCount = computed(() => {
  return hasOwnedTeams.value ? 1 : 0;
});
const canDelete = computed(() => {
  return confirmationText.value === "DELETE MY ACCOUNT";
});
const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString();
};
const copyAccountId = async () => {
  try {
    await navigator.clipboard.writeText($supabase.user.id);
    accountIdCopied.value = true;
    setTimeout(() => {
      accountIdCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy account ID:", error);
  }
};
const closeDialog = () => {
  showConfirmationDialog.value = false;
  confirmationText.value = "";
  confirmationError.value = false;
  deleteError.value = "";
};
const deleteAccount = async () => {
  if (!canDelete.value) {
    confirmationError.value = true;
    return;
  }
  isDeleting.value = true;
  deleteError.value = "";
  try {
    // TODO: Implement Supabase account deletion (likely via RPC or Edge Function)
    console.warn("Account deletion not yet implemented for Supabase");
    deleteError.value =
      "Account deletion is currently disabled during migration.";
    await new Promise((resolve) => setTimeout(resolve, 1000));
    throw new Error("Account deletion is currently disabled.");
  } catch (error) {
    console.error("Account deletion error:", error);
    deleteError.value =
      error.message || "Failed to delete account. Please try again.";
  } finally {
    isDeleting.value = false;
  }
};
const redirectToHome = async () => {
  try {
    showSuccessDialog.value = false;
    console.log("Signing out user and redirecting to dashboard...");
    localStorage.clear();
    await $supabase.signOut();
    await router.push("/");
    console.log("Successfully signed out and redirected to dashboard");
  } catch (error) {
    console.error("Failed to sign out and redirect:", error);
    window.location.href = "/";
  }
};
</script>

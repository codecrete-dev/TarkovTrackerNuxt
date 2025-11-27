<template>
  <GenericCard
    icon="mdi-account-supervisor"
    icon-color="white"
    highlight-color="secondary"
  >
    <template #title>
      {{ $t("page.team.card.myteam.title") }}
    </template>
    <template #content>
      <div v-if="!localUserTeam" class="text-center py-4">
        {{ $t("page.team.card.myteam.no_team") }}
      </div>
      <div v-else class="p-4">
        <team-input-row
          v-model="visibleUrl"
          :label="$t('page.team.card.myteam.team_invite_url_label')"
          icon="mdi-content-copy"
          readonly
          @action="copyUrl"
        />
      </div>
    </template>
    <template #footer>
      <div class="p-4 flex justify-start items-end">
        <UButton
          v-if="!localUserTeam"
          :disabled="loading.createTeam || !isLoggedIn"
          :loading="loading.createTeam"
          variant="outline"
          class="mx-1"
          icon="i-mdi-account-group"
          @click="handleCreateTeam"
        >
          {{ $t("page.team.card.myteam.create_new_team") }}
        </UButton>
        <UButton
          v-else
          :disabled="loading.leaveTeam || !isLoggedIn"
          :loading="loading.leaveTeam"
          variant="outline"
          class="mx-1"
          icon="i-mdi-account-off"
          @click="handleLeaveTeam"
        >
          {{
            isTeamOwner
              ? $t("page.team.card.myteam.disband_team")
              : $t("page.team.card.myteam.leave_team")
          }}
        </UButton>
      </div>
    </template>
  </GenericCard>
</template>
<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
// Team functions moved to Cloudflare Workers - TODO: Implement replacement
import { useTeamStoreWithSupabase } from "@/stores/useTeamStore";
import { useSystemStoreWithSupabase } from "@/stores/useSystemStore";
import { usePreferencesStore } from "@/stores/preferences";
import { useTarkovStore } from "@/stores/tarkov";
import GenericCard from "@/components/ui/GenericCard.vue";
import TeamInputRow from "./TeamInputRow.vue";
const { t } = useI18n({ useScope: "global" });
const { teamStore } = useTeamStoreWithSupabase();
const { systemStore } = useSystemStoreWithSupabase();
const preferencesStore = usePreferencesStore();
const tarkovStore = useTarkovStore();
const { $supabase } = useNuxtApp();
const toast = useToast();
const isLoggedIn = computed(() => $supabase.user.loggedIn);
const generateRandomName = (length = 6) =>
  Array.from({ length }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 62)
    )
  ).join("");
const localUserTeam = computed(() => systemStore.$state?.team || null);
const isTeamOwner = computed(
  () =>
    teamStore.$state.owner === $supabase.user.id &&
    systemStore.$state?.team != null
);
const loading = ref({ createTeam: false, leaveTeam: false });
const validateAuth = () => {
  if (!$supabase.user.loggedIn || !$supabase.user.id) {
    throw new Error(t("page.team.card.myteam.user_not_authenticated"));
  }
};
const callTeamFunction = async (functionName, payload = {}) => {
  // TODO: Implement Cloudflare Workers integration
  console.log(
    "TODO: Implement Cloudflare Workers function:",
    functionName,
    payload
  );
  throw new Error("Team functions not yet implemented with Cloudflare Workers");
};
const waitForStoreUpdate = (storeFn, condition, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new Error("Store update timeout")),
      timeout
    );
    const unwatch = watch(
      storeFn,
      (newValue) => {
        if (condition(newValue)) {
          clearTimeout(timeoutId);
          unwatch();
          resolve(newValue);
        }
      },
      { immediate: true, deep: true }
    );
  });
};
const showNotification = (message, color = "primary") => {
  toast.add({ title: message, color: color === "error" ? "red" : "primary" });
};
const handleCreateTeam = async () => {
  loading.value.createTeam = true;
  try {
    validateAuth();
    const result = await callTeamFunction("createTeam");
    if (!result?.team) {
      throw new Error(t("page.team.card.myteam.create_team_error_ui_update"));
    }
    await waitForStoreUpdate(
      () => systemStore.$state.team,
      (teamId) => teamId != null
    );
    await waitForStoreUpdate(
      () => teamStore.$state,
      (state) => state?.owner === $supabase.user.id && state?.password
    );
    await nextTick();
    if (localUserTeam.value) {
      if (isTeamOwner.value) {
        tarkovStore.setDisplayName(generateRandomName());
      }
      showNotification(t("page.team.card.myteam.create_team_success"));
    } else {
      throw new Error(t("page.team.card.myteam.create_team_error_ui_update"));
    }
  } catch (error) {
    console.error("[MyTeam] Error creating team:", error);
    const message =
      error.details?.error ||
      error.message ||
      t("page.team.card.myteam.create_team_error");
    showNotification(message, "error");
  }
  loading.value.createTeam = false;
};
const handleLeaveTeam = async () => {
  loading.value.leaveTeam = true;
  try {
    validateAuth();
    const result = await callTeamFunction("leaveTeam");
    if (!result?.left && systemStore.$state.team) {
      throw new Error(t("page.team.card.myteam.leave_team_error"));
    }
    if (tarkovStore.displayName.startsWith("User ")) {
      tarkovStore.setDisplayName(tarkovStore.getDefaultDisplayName());
    }
    showNotification(t("page.team.card.myteam.leave_team_success"));
  } catch (error) {
    console.error("[MyTeam] Error leaving team:", error);
    const message =
      error.message || t("page.team.card.myteam.leave_team_error_unexpected");
    showNotification(message, "error");
  }
  loading.value.leaveTeam = false;
};
const copyUrl = () => {
  if (teamUrl.value) {
    navigator.clipboard.writeText(teamUrl.value);
    showNotification("URL copied to clipboard");
  }
};
const teamUrl = computed(() => {
  const { team: teamId } = systemStore.$state;
  const { password } = teamStore.$state;
  if (!teamId || !password) return "";
  const baseUrl = window.location.href.split("?")[0];
  const params = new URLSearchParams({ team: teamId, code: password });
  return `${baseUrl}?${params}`;
});
const visibleUrl = computed(() =>
  preferencesStore.getStreamerMode
    ? t("page.team.card.myteam.url_hidden")
    : teamUrl.value
);
watch(
  () => tarkovStore.getDisplayName,
  (newDisplayName) => {
    if (isTeamOwner.value && newDisplayName !== teamStore.getOwnerDisplayName) {
      teamStore.setOwnerDisplayName(newDisplayName);
    }
  }
);
</script>

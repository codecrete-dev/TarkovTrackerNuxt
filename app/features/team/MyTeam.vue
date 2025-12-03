<template>
  <GenericCard icon="mdi-account-supervisor" icon-color="white" highlight-color="secondary">
    <template #title>
      {{ $t('page.team.card.myteam.title') }}
    </template>
    <template #content>
      <div v-if="!localUserTeam" class="py-4 text-center">
        {{ $t('page.team.card.myteam.no_team') }}
      </div>
      <div v-else class="space-y-4 p-4">
        <!-- Display Name Input -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ $t('page.team.card.myteam.display_name_label') }}
          </label>
          <div class="flex items-center gap-2">
            <UInput
              v-model="displayName"
              :maxlength="displayNameMaxLength"
              :placeholder="$t('page.team.card.myteam.display_name_placeholder')"
              class="flex-1"
              @blur="saveDisplayName"
              @keyup.enter="saveDisplayName"
            />
            <UButton
              icon="i-mdi-check"
              color="primary"
              variant="ghost"
              size="xs"
              :disabled="!displayNameChanged"
              @click="saveDisplayName"
            >
              {{ $t('page.team.card.myteam.save') }}
            </UButton>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ $t('page.team.card.myteam.display_name_hint') }}
          </p>
        </div>
        <!-- Team Invite URL -->
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">
            {{ $t('page.team.card.myteam.team_invite_url_label') }}
          </label>
          <div class="flex items-center gap-2">
            <UButton
              :icon="linkVisible ? 'i-mdi-eye-off' : 'i-mdi-eye'"
              variant="ghost"
              size="xs"
              @click="linkVisible = !linkVisible"
            >
              {{
                linkVisible
                  ? $t('page.team.card.myteam.hide_link')
                  : $t('page.team.card.myteam.show_link')
              }}
            </UButton>
            <UButton
              v-if="linkVisible"
              icon="i-mdi-content-copy"
              variant="ghost"
              size="xs"
              @click="copyUrl"
            >
              {{ $t('page.team.card.myteam.copy_link') }}
            </UButton>
          </div>
        </div>
        <div v-if="linkVisible" class="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <div class="font-mono text-sm break-all">
            {{ teamUrl }}
          </div>
        </div>
        <div v-else class="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <div class="text-sm text-gray-500 italic dark:text-gray-400">
            {{ $t('page.team.card.myteam.link_hidden_message') }}
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div
        class="flex items-center justify-start gap-2 border-t border-gray-200 p-4 dark:border-gray-700"
      >
        <UButton
          v-if="!localUserTeam"
          :disabled="loading.createTeam || !isLoggedIn"
          :loading="loading.createTeam"
          color="primary"
          icon="i-mdi-account-group"
          @click="handleCreateTeam"
        >
          {{ $t('page.team.card.myteam.create_new_team') }}
        </UButton>
        <UButton
          v-else
          :disabled="loading.leaveTeam || !isLoggedIn"
          :loading="loading.leaveTeam"
          color="error"
          variant="outline"
          icon="i-mdi-account-off"
          @click="handleLeaveTeam"
        >
          {{
            isTeamOwner
              ? $t('page.team.card.myteam.disband_team')
              : $t('page.team.card.myteam.leave_team')
          }}
        </UButton>
      </div>
    </template>
  </GenericCard>
</template>
<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import GenericCard from '@/components/ui/GenericCard.vue';
import { useEdgeFunctions } from '@/composables/api/useEdgeFunctions';
import { useSystemStoreWithSupabase } from '@/stores/useSystemStore';
import { useTarkovStore } from '@/stores/useTarkov';
import { useTeamStoreWithSupabase } from '@/stores/useTeamStore';
import type { SystemState, TeamState } from '@/types/tarkov';
import type { CreateTeamResponse, LeaveTeamResponse } from '@/types/team';
import { LIMITS } from '@/utils/constants';
import { logger } from '@/utils/logger';
  const { t } = useI18n({ useScope: 'global' });
  const { teamStore } = useTeamStoreWithSupabase();
  const { systemStore } = useSystemStoreWithSupabase();
  const tarkovStore = useTarkovStore();
  const { $supabase } = useNuxtApp();
  const toast = useToast();
  const { createTeam, leaveTeam } = useEdgeFunctions();
  const isLoggedIn = computed(() => $supabase.user.loggedIn);
  const linkVisible = ref(false);
  const displayNameMaxLength = LIMITS.DISPLAY_NAME_MAX_LENGTH;
  // Display name management
  const displayName = ref(tarkovStore.getDisplayName() || '');
  const initialDisplayName = ref(tarkovStore.getDisplayName() || '');
  const displayNameChanged = computed(() => {
    return displayName.value !== initialDisplayName.value && displayName.value.trim() !== '';
  });
  const saveDisplayName = () => {
    if (displayName.value.trim() === '') return;
    const trimmedName = displayName.value.trim().substring(0, LIMITS.DISPLAY_NAME_MAX_LENGTH);
    tarkovStore.setDisplayName(trimmedName);
    initialDisplayName.value = trimmedName;
    displayName.value = trimmedName;
    showNotification(t('page.team.card.myteam.display_name_saved'));
  };
  // Watch for changes to the store's display name (e.g., from sync)
  watch(
    () => tarkovStore.getDisplayName(),
    (newName) => {
      if (newName && newName !== displayName.value) {
        displayName.value = newName;
        initialDisplayName.value = newName;
      }
    }
  );
  const generateRandomName = (length: number = LIMITS.RANDOM_NAME_LENGTH) =>
    Array.from({ length }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
        Math.floor(Math.random() * 62)
      )
    ).join('');
  // Access team ID directly from store state for better reactivity
  const localUserTeam = computed(() => {
    const state = systemStore.$state as unknown as { team?: string | null; team_id?: string | null };
    const teamId = state.team ?? state.team_id ?? null;
    logger.debug('[MyTeam] Computing localUserTeam:', { team: state.team, team_id: state.team_id, result: teamId });
    return teamId;
  });
  // Debug: Watch for changes to localUserTeam
  watch(
    () => localUserTeam.value,
    (newTeam, oldTeam) => {
      logger.debug('[MyTeam] localUserTeam changed:', { oldTeam, newTeam });
      logger.debug('[MyTeam] Raw store state:', systemStore.$state);
    },
    { immediate: true }
  );
  const isTeamOwner = computed(() => {
    const teamState = teamStore.$state as { owner_id?: string; owner?: string };
    const owner = teamState.owner_id ?? teamState.owner;
    // Access system store state directly
    const systemState = systemStore.$state as unknown as { team?: string | null; team_id?: string | null };
    const hasTeam = !!(systemState.team || systemState.team_id);
    return owner === $supabase.user.id && hasTeam;
  });
  const loading = ref({ createTeam: false, leaveTeam: false });
  const validateAuth = () => {
    if (!$supabase.user.loggedIn || !$supabase.user.id) {
      throw new Error(t('page.team.card.myteam.user_not_authenticated'));
    }
  };
  const buildTeamName = () => {
    const displayName = tarkovStore.getDisplayName();
    const fallbackName =
      $supabase.user.displayName ||
      $supabase.user.username ||
      $supabase.user.email?.split('@')[0] ||
      'Team';
    return `${displayName || fallbackName}-${generateRandomName(4)}`;
  };
  const buildTeamPassword = () => generateRandomName(12);
  interface TeamFunctionPayload {
    name?: string;
    password?: string;
    maxMembers?: number;
    teamId?: string;
  }
  const callTeamFunction = async (
    functionName: string,
    payload: TeamFunctionPayload = {}
  ): Promise<CreateTeamResponse | LeaveTeamResponse> => {
    validateAuth();
    switch (functionName) {
      case 'createTeam': {
        const teamName = payload.name || buildTeamName();
        const password = payload.password || buildTeamPassword();
        const maxMembers = payload.maxMembers || 5;
        return await createTeam(teamName, password, maxMembers);
      }
      case 'leaveTeam': {
        // Access team ID directly from state instead of using getter
        const state = systemStore.$state as unknown as { team?: string | null; team_id?: string | null };
        const teamId = payload.teamId || state.team || state.team_id;
        if (!teamId) {
          throw new Error(t('page.team.card.myteam.no_team'));
        }
        return await leaveTeam(teamId);
      }
      default:
        throw new Error(`Unsupported team function: ${functionName}`);
    }
  };
  const showNotification = (message: string, color: 'primary' | 'error' = 'primary') => {
    toast.add({ title: message, color: color === 'error' ? 'error' : 'primary' });
  };
  const handleCreateTeam = async () => {
    loading.value.createTeam = true;
    try {
      logger.debug('[MyTeam] Starting team creation process...');
      validateAuth();
      logger.debug('[MyTeam] Auth validated, user ID:', $supabase.user.id);
      // Diagnostic: Check user_system table for this user
      logger.debug('[MyTeam] [DIAGNOSTIC] Checking user_system table...');
      const { data: userSystemData, error: userSystemError } = await $supabase.client
        .from('user_system')
        .select('*')
        .eq('user_id', $supabase.user.id)
        .maybeSingle();
      logger.debug('[MyTeam] [DIAGNOSTIC] user_system data:', userSystemData);
      logger.debug('[MyTeam] [DIAGNOSTIC] user_system error:', userSystemError);
      // ALWAYS check database for existing team membership before creating
      // Don't rely solely on local state as it could be out of sync
      logger.debug('[MyTeam] Checking for existing team membership...');
      const { data: membership, error: membershipError } = await $supabase.client
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', $supabase.user.id)
        .maybeSingle();
      if (membershipError) {
        logger.error('[MyTeam] Error checking membership:', membershipError);
        throw membershipError;
      }
      if (membership?.team_id) {
        logger.warn('[MyTeam] User already in team:', membership.team_id);
        // Sync local state with database truth (cover both keys for reactivity)
        systemStore.$patch({ team: membership.team_id, team_id: membership.team_id } as Partial<SystemState>);
        showNotification('You are already in a team. Leave your current team first.', 'error');
        loading.value.createTeam = false;
        return;
      }
      logger.debug('[MyTeam] No existing membership found, proceeding with creation');
      logger.debug('[MyTeam] Calling team creation function...');
      const result = (await callTeamFunction('createTeam')) as CreateTeamResponse;
      logger.debug('[MyTeam] Team creation response:', result);
      if (!result?.team) {
        logger.error('[MyTeam] Invalid response structure - missing team object');
        throw new Error(t('page.team.card.myteam.create_team_error_ui_update'));
      }
      logger.debug('[MyTeam] Team created successfully, ID:', result.team.id);
      // Manually update systemStore with the new team ID
      logger.debug('[MyTeam] Patching system store with team ID:', result.team.id);
      systemStore.$patch({ team: result.team.id, team_id: result.team.id } as Partial<SystemState>);
      // Manually update teamStore with the new team data (including joinCode)
      if (result.team.joinCode) {
        logger.debug('[MyTeam] Patching team store with join code:', result.team.joinCode);
        teamStore.$patch({
          joinCode: result.team.joinCode,
          owner: result.team.ownerId,
          members: [result.team.ownerId]
        } as Partial<TeamState>);
      }
      // Wait a brief moment for database to settle, then verify
      logger.debug('[MyTeam] Waiting 500ms for database to settle...');
      await new Promise(resolve => setTimeout(resolve, 500));
      // Verify the team was created by checking the database directly
      logger.debug('[MyTeam] Verifying team creation in database...');
      const { data: verification, error: verificationError } = await $supabase.client
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', $supabase.user.id)
        .eq('team_id', result.team.id)
        .maybeSingle();
      if (verificationError) {
        logger.error('[MyTeam] Verification query error:', verificationError);
      }
      logger.debug('[MyTeam] Verification result:', verification);
      if (!verification) {
        logger.error('[MyTeam] Team membership not found in database after creation');
        throw new Error(t('page.team.card.myteam.create_team_error_ui_update'));
      }
      // Team creation verified successful - Supabase listener will sync state
      logger.debug('[MyTeam] Team creation verified successfully');
      await nextTick();
      // Generate random display name for team owner
      if (result.team.ownerId === $supabase.user.id) {
        logger.debug('[MyTeam] Setting random display name for team owner');
        tarkovStore.setDisplayName(generateRandomName());
      }
      logger.debug('[MyTeam] Team creation complete!');
      showNotification(t('page.team.card.myteam.create_team_success'));
    } catch (error: unknown) {
      logger.error('[MyTeam] Error creating team:', error);
      const message =
        error &&
        typeof error === 'object' &&
        'details' in error &&
        error.details &&
        typeof error.details === 'object' &&
        'error' in error.details
          ? String(error.details.error)
          : error instanceof Error
            ? error.message
            : t('page.team.card.myteam.create_team_error');
      showNotification(message, 'error');
    }
    loading.value.createTeam = false;
  };
  const handleLeaveTeam = async () => {
    loading.value.leaveTeam = true;
    try {
      validateAuth();
      // Diagnostic: Check team_memberships directly
      const systemState = systemStore.$state as unknown as { team?: string | null; team_id?: string | null };
      const currentTeamId = systemState.team ?? systemState.team_id;
      logger.debug('[MyTeam] [DIAGNOSTIC] Current team from state:', currentTeamId);
      const { data: membershipData, error: membershipError } = await $supabase.client
        .from('team_memberships')
        .select('*')
        .eq('user_id', $supabase.user.id)
        .eq('team_id', currentTeamId)
        .maybeSingle();
      logger.debug('[MyTeam] [DIAGNOSTIC] Current membership:', membershipData);
      logger.debug('[MyTeam] [DIAGNOSTIC] Membership error:', membershipError);
      // Handle broken state: user has team_id but no membership record
      if (!membershipData && !membershipError) {
        logger.warn('[MyTeam] [DIAGNOSTIC] Broken state detected: team_id exists but no membership record');
        logger.debug('[MyTeam] [DIAGNOSTIC] Cleaning up broken state...');
        // Clear the team_id from user_system
        systemStore.$patch({ team: null, team_id: null } as Partial<SystemState>);
        // Delete the team if it has no members
        const { data: allMembers } = await $supabase.client
          .from('team_memberships')
          .select('user_id')
          .eq('team_id', currentTeamId);
        if (!allMembers || allMembers.length === 0) {
          logger.debug('[MyTeam] [DIAGNOSTIC] Team has no members, deleting team record...');
          const { error: deleteTeamError } = await $supabase.client
            .from('teams')
            .delete()
            .eq('id', currentTeamId);
          if (deleteTeamError) {
            logger.error('[MyTeam] [DIAGNOSTIC] Failed to delete team:', deleteTeamError);
          } else {
            logger.debug('[MyTeam] [DIAGNOSTIC] Successfully deleted empty team');
          }
        }
        showNotification('Your team data was in a broken state and has been cleaned up. Please create a new team.');
        loading.value.leaveTeam = false;
        return;
      }
      // Check if there are other members
      const { data: otherMembers, error: otherMembersError } = await $supabase.client
        .from('team_memberships')
        .select('*')
        .eq('team_id', currentTeamId)
        .neq('user_id', $supabase.user.id);
      logger.debug('[MyTeam] [DIAGNOSTIC] Other members:', otherMembers);
      logger.debug('[MyTeam] [DIAGNOSTIC] Other members error:', otherMembersError);
      logger.debug('[MyTeam] [DIAGNOSTIC] Other members count:', otherMembers?.length ?? 0);
      // If there are ghost members, try to clean them up
      if (otherMembers && otherMembers.length > 0) {
        logger.warn('[MyTeam] [DIAGNOSTIC] Found ghost members, attempting to clean up...');
        for (const ghostMember of otherMembers) {
          logger.debug('[MyTeam] [DIAGNOSTIC] Deleting ghost member:', ghostMember);
          const { error: deleteError } = await $supabase.client
            .from('team_memberships')
            .delete()
            .eq('team_id', currentTeamId)
            .eq('user_id', ghostMember.user_id);
          if (deleteError) {
            logger.error('[MyTeam] [DIAGNOSTIC] Failed to delete ghost member:', deleteError);
          } else {
            logger.debug('[MyTeam] [DIAGNOSTIC] Successfully deleted ghost member:', ghostMember.user_id);
          }
        }
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        logger.debug('[MyTeam] [DIAGNOSTIC] Ghost cleanup complete, retrying leave/disband...');
      }
      const result = (await callTeamFunction('leaveTeam')) as LeaveTeamResponse;
      if (!result.success) {
        throw new Error(t('page.team.card.myteam.leave_team_error'));
      }
      // Manually update systemStore to clear team ID
      // IMPORTANT: Clear both 'team' and 'team_id' to ensure reactivity updates
      systemStore.$patch({ team: null, team_id: null } as Partial<SystemState>);
      // Also reset team store
      teamStore.$reset();
      // Wait a brief moment for database to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      await nextTick();
      const displayName = tarkovStore.getDisplayName();
      if (displayName && displayName.startsWith('User ')) {
        // Reset to a generic display name when leaving team
        tarkovStore.setDisplayName('User');
      }
      showNotification(t('page.team.card.myteam.leave_team_success'));
    } catch (error: unknown) {
      logger.error('[MyTeam] Error leaving team:', error);
      const message =
        error instanceof Error
          ? error.message
          : t('page.team.card.myteam.leave_team_error_unexpected');
      showNotification(message, 'error');
    }
    loading.value.leaveTeam = false;
  };
  const copyUrl = async () => {
    // Guard against SSR - clipboard API is only available on client
    if (typeof window === 'undefined' || !navigator || !navigator.clipboard) {
      logger.warn('[MyTeam] Clipboard API is not available');
      return;
    }
    if (teamUrl.value) {
      try {
        await navigator.clipboard.writeText(teamUrl.value);
        showNotification('URL copied to clipboard');
      } catch (error) {
        logger.error('[MyTeam] Failed to copy URL to clipboard:', error);
        showNotification('Failed to copy URL to clipboard', 'error');
      }
    }
  };
  const teamUrl = computed(() => {
    // Access state directly for reactivity
    const systemState = systemStore.$state as unknown as { team?: string | null; team_id?: string | null };
    const teamId = systemState.team ?? systemState.team_id;
    // Use getter to get invite code (supports legacy password and new joinCode)
    const code = teamStore.inviteCode;
    // Debug logging
    logger.debug('[MyTeam] teamUrl computed:', {
      teamId,
      code,
      teamStoreState: teamStore.$state,
      inviteCode: teamStore.inviteCode
    });
    if (!teamId || !code) return '';
    // Use Nuxt-safe route composables instead of window.location
    // This works during SSR and client-side
    if (import.meta.client) {
      const baseUrl = window.location.href.split('?')[0];
      const params = new URLSearchParams({ team: teamId, code });
      return `${baseUrl}?${params}`;
    } else {
      // During SSR, construct URL from route path
      const route = useRoute();
      const config = useRuntimeConfig();
      const baseUrl = config.public.siteUrl || '';
      const currentPath = route.path;
      const params = new URLSearchParams({ team: teamId, code });
      return `${baseUrl}${currentPath}?${params}`;
    }
  });
  watch(
    () => tarkovStore.getDisplayName,
    (newDisplayName) => {
      if (isTeamOwner.value && newDisplayName !== teamStore.getOwnerDisplayName) {
        teamStore.setOwnerDisplayName(newDisplayName);
      }
    }
  );
</script>

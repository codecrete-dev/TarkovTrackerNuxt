<template>
  <UModal
    v-model:open="isOpen"
    :title="t('page.tasks.settings.title', 'Task Settings')"
    :description="t('page.tasks.settings.description', 'Configure task filters and appearance')"
  >
    <UButton variant="ghost" color="neutral" size="sm" class="text-gray-400" @click="isOpen = true">
      <UIcon name="i-mdi-tune" class="h-4 w-4 sm:mr-1.5" />
      <span class="hidden text-xs sm:inline">SETTINGS</span>
    </UButton>
    <template #content>
      <UCard class="bg-white dark:bg-contentbackground">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">
                {{ t('page.tasks.settings.title', 'Task Settings') }}
              </h3>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-mdi-close"
              size="sm"
              :aria-label="t('page.tasks.filters.close', 'Close')"
              @click="isOpen = false"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            />
          </div>
        </template>
        <div class="space-y-6">
          <!-- TASK FILTERS Section -->
          <section class="space-y-2">
            <div>
              <p class="text-primary-600 dark:text-primary-400 text-xs font-semibold tracking-wide uppercase">
                {{ t('page.tasks.settings.tabs.filters', 'TASK FILTERS') }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ t('page.tasks.settings.filters.hint', 'Control which tasks appear.') }}
              </p>
            </div>
            <SettingsToggle
              v-model="showNonSpecialTasks"
              :label="labelShowNonSpecialTasks"
              :tooltip="tooltipShowNonSpecialTasks"
            />
            <SettingsToggle
              :model-value="showKappaTasks"
              :label="labelShowKappaTasks"
              :tooltip="tooltipShowKappaTasks"
              @update:model-value="preferencesStore.setHideNonKappaTasks(!$event)"
            />
            <SettingsToggle
              v-model="showEodTasks"
              :label="labelShowEodTasks"
              :tooltip="tooltipShowEodTasks"
            />
            <SettingsToggle
              v-model="showLightkeeperTasks"
              :label="labelShowLightkeeperTasks"
              :tooltip="tooltipShowLightkeeperTasks"
            />
          </section>
          <!-- APPEARANCE Section -->
          <section class="space-y-2">
            <div>
              <p class="text-primary-600 dark:text-primary-400 text-xs font-semibold tracking-wide uppercase">
                {{ t('page.tasks.settings.tabs.appearance', 'APPEARANCE') }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ t('page.tasks.settings.appearance.hint', 'Tune how task cards look.') }}
              </p>
            </div>
            <SettingsToggle
              v-model="showRequiredLabels"
              :label="labelShowRequiredLabels"
              :tooltip="tooltipShowRequiredLabels"
            />
            <SettingsToggle
              v-model="showNotRequiredLabels"
              :label="labelShowNotRequiredLabels"
              :tooltip="tooltipShowNotRequiredLabels"
            />
            <SettingsToggle
              v-model="showExperienceRewards"
              :label="labelShowExperienceRewards"
              :tooltip="tooltipShowExperienceRewards"
            />
            <SettingsToggle
              v-model="showTaskIds"
              :label="labelShowTaskIds"
              :tooltip="tooltipShowTaskIds"
            />
            <SettingsToggle
              v-model="showNextQuests"
              :label="labelShowNextQuests"
              :tooltip="tooltipShowNextQuests"
            />
            <SettingsToggle
              v-model="showPreviousQuests"
              :label="labelShowPreviousQuests"
              :tooltip="tooltipShowPreviousQuests"
            />
          </section>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import SettingsToggle from '@/features/tasks/SettingsToggle.vue';
  import { usePreferencesStore } from '@/stores/usePreferences';
  const { t } = useI18n({ useScope: 'global' });
  const preferencesStore = usePreferencesStore();
  const isOpen = ref(false);
  // Labels and tooltips (defined in script to avoid template quoting issues)
  const labelShowNonSpecialTasks = computed(() =>
    t(
      'page.tasks.settings.filters.showNonSpecialTasks',
      'Show tasks without Lightkeeper, Kappa, or EOD requirement'
    )
  );
  const tooltipShowNonSpecialTasks = computed(() =>
    t(
      'page.tasks.settings.filters.showNonSpecialTasksTooltip',
      'Show regular tasks that do not require Kappa, Lightkeeper, or EOD edition'
    )
  );
  const labelShowKappaTasks = computed(() =>
    t('page.tasks.settings.filters.showKappaTasks', 'Show "Kappa Required" tasks')
  );
  const tooltipShowKappaTasks = computed(() =>
    t(
      'page.tasks.settings.filters.showKappaTasksTooltip',
      'Show tasks required for Kappa container'
    )
  );
  const labelShowEodTasks = computed(() =>
    t('page.tasks.settings.filters.showEodTasks', 'Show EOD-only tasks')
  );
  const tooltipShowEodTasks = computed(() =>
    t(
      'page.tasks.settings.filters.showEodTasksTooltip',
      'Show tasks exclusive to Edge of Darkness edition owners'
    )
  );
  const labelShowLightkeeperTasks = computed(() =>
    t(
      'page.tasks.settings.filters.showLightkeeperTasks',
      'Show Lightkeeper Tasks and Lightkeeper-required Tasks'
    )
  );
  const tooltipShowLightkeeperTasks = computed(() =>
    t(
      'page.tasks.settings.filters.showLightkeeperTasksTooltip',
      'Show tasks from Lightkeeper trader and tasks required for Lightkeeper'
    )
  );
  const labelShowRequiredLabels = computed(() =>
    t('page.tasks.settings.appearance.showRequiredLabels', 'Show "Required" labels')
  );
  const tooltipShowRequiredLabels = computed(() =>
    t(
      'page.tasks.settings.appearance.showRequiredLabelsTooltip',
      'Show labels indicating Kappa or Lightkeeper requirements'
    )
  );
  const labelShowNotRequiredLabels = computed(() =>
    t('page.tasks.settings.appearance.showNotRequiredLabels', 'Show "Not Required" labels')
  );
  const tooltipShowNotRequiredLabels = computed(() =>
    t(
      'page.tasks.settings.appearance.showNotRequiredLabelsTooltip',
      'Show Non-Kappa labels on tasks not required for Kappa'
    )
  );
  const labelShowExperienceRewards = computed(() =>
    t('page.tasks.settings.appearance.showExperienceRewards', 'Show experience rewards')
  );
  const tooltipShowExperienceRewards = computed(() =>
    t(
      'page.tasks.settings.appearance.showExperienceRewardsTooltip',
      'Display experience points rewarded for completing tasks'
    )
  );
  const labelShowTaskIds = computed(() =>
    t('page.tasks.settings.appearance.showTaskIds', 'Show task IDs')
  );
  const tooltipShowTaskIds = computed(() =>
    t(
      'page.tasks.settings.appearance.showTaskIdsTooltip',
      'Display internal task ID at the bottom of each task card'
    )
  );
  const labelShowNextQuests = computed(() =>
    t('page.tasks.settings.appearance.showNextQuests', 'Show next quests')
  );
  const tooltipShowNextQuests = computed(() =>
    t(
      'page.tasks.settings.appearance.showNextQuestsTooltip',
      'Display tasks that will be unlocked after completing this task'
    )
  );
  const labelShowPreviousQuests = computed(() =>
    t('page.tasks.settings.appearance.showPreviousQuests', 'Show previous quests')
  );
  const tooltipShowPreviousQuests = computed(() =>
    t(
      'page.tasks.settings.appearance.showPreviousQuestsTooltip',
      'Display tasks that must be completed before this task'
    )
  );
  // Task filter preferences (inverted for show/hide semantics)
  const showKappaTasks = computed(() => !preferencesStore.getHideNonKappaTasks);
  // New filter preferences with two-way binding
  const showNonSpecialTasks = computed({
    get: () => preferencesStore.getShowNonSpecialTasks,
    set: (value) => preferencesStore.setShowNonSpecialTasks(value),
  });
  const showEodTasks = computed({
    get: () => preferencesStore.getShowEodTasks,
    set: (value) => preferencesStore.setShowEodTasks(value),
  });
  const showLightkeeperTasks = computed({
    get: () => preferencesStore.getShowLightkeeperTasks,
    set: (value) => preferencesStore.setShowLightkeeperTasks(value),
  });
  // Appearance preferences
  const showRequiredLabels = computed({
    get: () => preferencesStore.getShowRequiredLabels,
    set: (value) => preferencesStore.setShowRequiredLabels(value),
  });
  const showNotRequiredLabels = computed({
    get: () => preferencesStore.getShowNotRequiredLabels,
    set: (value) => preferencesStore.setShowNotRequiredLabels(value),
  });
  const showExperienceRewards = computed({
    get: () => preferencesStore.getShowExperienceRewards,
    set: (value) => preferencesStore.setShowExperienceRewards(value),
  });
  const showTaskIds = computed({
    get: () => preferencesStore.getShowTaskIds,
    set: (value) => preferencesStore.setShowTaskIds(value),
  });
  const showNextQuests = computed({
    get: () => preferencesStore.getShowNextQuests,
    set: (value) => preferencesStore.setShowNextQuests(value),
  });
  const showPreviousQuests = computed({
    get: () => preferencesStore.getShowPreviousQuests,
    set: (value) => preferencesStore.setShowPreviousQuests(value),
  });
</script>

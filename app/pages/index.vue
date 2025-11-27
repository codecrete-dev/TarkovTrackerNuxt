<template>
  <div class="container mx-auto p-4 max-w-7xl min-h-[calc(100vh-250px)]">
    <!-- Hero Section with Main Progress -->
    <div
      class="relative overflow-hidden rounded-2xl mb-6 bg-linear-to-br from-primary-900/40 via-surface-900/90 to-surface-900 border border-primary-700/30 shadow-2xl"
    >
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--color-primary-500),0.1),transparent_50%)]"
      ></div>
      <div class="relative p-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <!-- Main Progress Circle -->
          <div class="flex flex-col items-center justify-center">
            <div class="relative">
              <svg class="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="none"
                  class="text-surface-800"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="none"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="progressOffset"
                  class="text-primary-500 transition-all duration-1000 ease-out"
                  stroke-linecap="round"
                />
              </svg>
              <div
                class="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div class="text-5xl font-bold text-white">
                  {{ totalTasksPercentage }}%
                </div>
                <div class="text-sm text-surface-400 uppercase tracking-wider">
                  {{ $t("page.dashboard.hero.overall") }}
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Overview -->
          <div class="lg:col-span-2 space-y-6">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2">
                {{ $t("page.dashboard.hero.welcome") }}
              </h1>
              <p class="text-surface-400 text-lg">
                {{ $t("page.dashboard.hero.subtitle") }}
              </p>
            </div>

            <!-- Quick Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                class="bg-surface-800/50 rounded-xl p-4 border border-surface-700/50"
              >
                <div class="text-3xl font-bold text-primary-400">
                  {{ dashboardStats.completedTasks }}
                </div>
                <div
                  class="text-xs text-surface-400 uppercase tracking-wide mt-1"
                >
                  {{ $t("page.dashboard.hero.tasksComplete") }}
                </div>
              </div>
              <div
                class="bg-surface-800/50 rounded-xl p-4 border border-surface-700/50"
              >
                <div class="text-3xl font-bold text-success-400">
                  {{ dashboardStats.availableTasksCount }}
                </div>
                <div
                  class="text-xs text-surface-400 uppercase tracking-wide mt-1"
                >
                  {{ $t("page.dashboard.hero.available") }}
                </div>
              </div>
              <div
                class="bg-surface-800/50 rounded-xl p-4 border border-surface-700/50"
              >
                <div class="text-3xl font-bold text-error-400">
                  {{ dashboardStats.failedTasksCount }}
                </div>
                <div
                  class="text-xs text-surface-400 uppercase tracking-wide mt-1"
                >
                  {{ $t("page.dashboard.hero.failed") }}
                </div>
              </div>
              <div
                class="bg-surface-800/50 rounded-xl p-4 border border-surface-700/50"
              >
                <div class="text-3xl font-bold text-warning-400">
                  {{ currentLevel }}
                </div>
                <div
                  class="text-xs text-surface-400 uppercase tracking-wide mt-1"
                >
                  {{ $t("page.dashboard.hero.level") }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Breakdown Section -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-4 flex items-center">
        <UIcon name="i-mdi-chart-line" class="w-6 h-6 mr-2 text-primary-500" />
        {{ $t("page.dashboard.progress.title") }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Tasks Progress -->
        <div
          class="bg-surface-900 rounded-xl p-6 border border-surface-700/30 shadow-lg hover:border-primary-700/50 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center mr-3"
              >
                <UIcon
                  name="i-mdi-checkbox-marked-circle-outline"
                  class="w-5 h-5 text-primary-400"
                />
              </div>
              <div>
                <div class="text-sm text-surface-400 uppercase tracking-wider">
                  {{ $t("page.dashboard.progress.tasks") }}
                </div>
                <div class="text-2xl font-bold text-white">
                  {{ dashboardStats.completedTasks }}/{{
                    dashboardStats.totalTasks
                  }}
                </div>
              </div>
            </div>
            <div class="text-3xl font-bold text-primary-400">
              {{ totalTasksPercentage }}%
            </div>
          </div>
          <div class="relative h-3 bg-surface-800 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-linear-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: `${totalTasksPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Objectives Progress -->
        <div
          class="bg-surface-900 rounded-xl p-6 border border-surface-700/30 shadow-lg hover:border-info-700/50 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-lg bg-info-600/15 flex items-center justify-center mr-3"
              >
                <UIcon
                  name="i-mdi-briefcase-search"
                  class="w-5 h-5 text-info-400"
                />
              </div>
              <div>
                <div class="text-sm text-surface-400 uppercase tracking-wider">
                  {{ $t("page.dashboard.progress.objectives") }}
                </div>
                <div class="text-2xl font-bold text-white">
                  {{ dashboardStats.completedObjectives }}/{{
                    dashboardStats.totalObjectives
                  }}
                </div>
              </div>
            </div>
            <div class="text-3xl font-bold text-info-400">
              {{ totalObjectivesPercentage }}%
            </div>
          </div>
          <div class="relative h-3 bg-surface-800 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-linear-to-r from-info-600 to-info-400 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: `${totalObjectivesPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Task Items Progress -->
        <div
          class="bg-surface-900 rounded-xl p-6 border border-surface-700/30 shadow-lg hover:border-success-700/50 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-lg bg-success-600/15 flex items-center justify-center mr-3"
              >
                <UIcon
                  name="i-mdi-package-variant"
                  class="w-5 h-5 text-success-400"
                />
              </div>
              <div>
                <div class="text-sm text-surface-400 uppercase tracking-wider">
                  {{ $t("page.dashboard.progress.items") }}
                </div>
                <div class="text-2xl font-bold text-white">
                  {{ dashboardStats.completedTaskItems }}/{{
                    dashboardStats.totalTaskItems
                  }}
                </div>
              </div>
            </div>
            <div class="text-3xl font-bold text-success-400">
              {{ totalTaskItemsPercentage }}%
            </div>
          </div>
          <div class="relative h-3 bg-surface-800 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-linear-to-r from-success-600 to-success-400 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: `${totalTaskItemsPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Kappa Progress -->
        <div
          class="bg-surface-900 rounded-xl p-6 border border-surface-700/30 shadow-lg hover:border-warning-700/50 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-lg bg-warning-600/15 flex items-center justify-center mr-3"
              >
                <UIcon name="i-mdi-trophy" class="w-5 h-5 text-warning-400" />
              </div>
              <div>
                <div class="text-sm text-surface-400 uppercase tracking-wider">
                  {{ $t("page.dashboard.progress.kappa") }}
                </div>
                <div class="text-2xl font-bold text-white">
                  {{ dashboardStats.completedKappaTasks }}/{{
                    dashboardStats.totalKappaTasks
                  }}
                </div>
              </div>
            </div>
            <div class="text-3xl font-bold text-warning-400">
              {{ totalKappaTasksPercentage }}%
            </div>
          </div>
          <div class="relative h-3 bg-surface-800 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-linear-to-r from-warning-600 to-warning-400 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: `${totalKappaTasksPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Lightkeeper Progress -->
        <div
          class="bg-surface-900 rounded-xl p-6 border border-surface-700/30 shadow-lg hover:border-purple-700/50 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-lg bg-purple-600/15 flex items-center justify-center mr-3"
              >
                <UIcon
                  name="i-mdi-lighthouse"
                  class="w-5 h-5 text-purple-400"
                />
              </div>
              <div>
                <div class="text-sm text-surface-400 uppercase tracking-wider">
                  {{ $t("page.dashboard.progress.lightkeeper") }}
                </div>
                <div class="text-2xl font-bold text-white">
                  {{ dashboardStats.completedLightkeeperTasks }}/{{
                    dashboardStats.totalLightkeeperTasks
                  }}
                </div>
              </div>
            </div>
            <div class="text-3xl font-bold text-purple-400">
              {{ totalLightkeeperTasksPercentage }}%
            </div>
          </div>
          <div class="relative h-3 bg-surface-800 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-linear-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: `${totalLightkeeperTasksPercentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trader Progress Section -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-4 flex items-center">
        <UIcon
          name="i-mdi-account-group"
          class="w-6 h-6 mr-2 text-primary-500"
        />
        {{ $t("page.dashboard.traders.title") }}
      </h2>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        <div
          v-for="trader in traderStats"
          :key="trader.id"
          class="bg-surface-900 rounded-lg p-3 border border-surface-700/30 hover:border-primary-700/30 transition-all shadow-sm hover:shadow-md"
        >
          <div class="flex items-center gap-3 mb-2">
            <img
              v-if="trader.imageLink"
              :src="trader.imageLink"
              :alt="trader.name"
              class="w-10 h-10 rounded-full bg-surface-800 border border-surface-700"
            />
            <div class="min-w-0 flex-1">
              <div class="text-xs font-semibold text-white truncate">
                {{ trader.name }}
              </div>
              <div class="text-xs text-surface-400">
                {{ trader.completedTasks }}/{{ trader.totalTasks }}
              </div>
            </div>
          </div>
          <div
            class="relative h-1.5 bg-surface-800 rounded-full overflow-hidden"
          >
            <div
              class="absolute inset-y-0 left-0 bg-linear-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-700 ease-out"
              :style="{ width: `${trader.percentage}%` }"
            ></div>
          </div>
          <div class="text-xs text-primary-400 font-medium mt-1 text-right">
            {{ trader.percentage }}%
          </div>
        </div>
      </div>
    </div>

    <!-- Milestones Section -->
    <div>
      <h2 class="text-2xl font-bold text-white mb-4 flex items-center">
        <UIcon name="i-mdi-star-circle" class="w-6 h-6 mr-2 text-primary-500" />
        {{ $t("page.dashboard.milestones.title") }}
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- 25% Milestone -->
        <div
          :class="[
            'relative overflow-hidden rounded-xl p-6 border transition-all',
            parseFloat(totalTasksPercentage) >= 25
              ? 'bg-linear-to-br from-primary-900/40 to-surface-900 border-primary-600/50 shadow-lg shadow-primary-900/20'
              : 'bg-surface-900/50 border-surface-700/30 opacity-50',
          ]"
        >
          <div class="relative z-10">
            <UIcon
              :name="
                parseFloat(totalTasksPercentage) >= 25
                  ? 'i-mdi-check-circle'
                  : 'i-mdi-circle-outline'
              "
              :class="[
                'w-12 h-12 mb-3',
                parseFloat(totalTasksPercentage) >= 25
                  ? 'text-primary-400'
                  : 'text-surface-600',
              ]"
            />
            <div class="text-3xl font-bold text-white mb-1">25%</div>
            <div class="text-xs text-surface-400 uppercase tracking-wider">
              {{ $t("page.dashboard.milestones.starter") }}
            </div>
          </div>
        </div>

        <!-- 50% Milestone -->
        <div
          :class="[
            'relative overflow-hidden rounded-xl p-6 border transition-all',
            parseFloat(totalTasksPercentage) >= 50
              ? 'bg-linear-to-br from-info-900/40 to-surface-900 border-info-600/50 shadow-lg shadow-info-900/20'
              : 'bg-surface-900/50 border-surface-700/30 opacity-50',
          ]"
        >
          <div class="relative z-10">
            <UIcon
              :name="
                parseFloat(totalTasksPercentage) >= 50
                  ? 'i-mdi-check-circle'
                  : 'i-mdi-circle-outline'
              "
              :class="[
                'w-12 h-12 mb-3',
                parseFloat(totalTasksPercentage) >= 50
                  ? 'text-info-400'
                  : 'text-surface-600',
              ]"
            />
            <div class="text-3xl font-bold text-white mb-1">50%</div>
            <div class="text-xs text-surface-400 uppercase tracking-wider">
              {{ $t("page.dashboard.milestones.halfway") }}
            </div>
          </div>
        </div>

        <!-- 75% Milestone -->
        <div
          :class="[
            'relative overflow-hidden rounded-xl p-6 border transition-all',
            parseFloat(totalTasksPercentage) >= 75
              ? 'bg-linear-to-br from-success-900/40 to-surface-900 border-success-600/50 shadow-lg shadow-success-900/20'
              : 'bg-surface-900/50 border-surface-700/30 opacity-50',
          ]"
        >
          <div class="relative z-10">
            <UIcon
              :name="
                parseFloat(totalTasksPercentage) >= 75
                  ? 'i-mdi-check-circle'
                  : 'i-mdi-circle-outline'
              "
              :class="[
                'w-12 h-12 mb-3',
                parseFloat(totalTasksPercentage) >= 75
                  ? 'text-success-400'
                  : 'text-surface-600',
              ]"
            />
            <div class="text-3xl font-bold text-white mb-1">75%</div>
            <div class="text-xs text-surface-400 uppercase tracking-wider">
              {{ $t("page.dashboard.milestones.veteran") }}
            </div>
          </div>
        </div>

        <!-- Kappa Milestone -->
        <div
          :class="[
            'relative overflow-hidden rounded-xl p-6 border transition-all',
            parseFloat(totalKappaTasksPercentage) >= 100
              ? 'bg-linear-to-br from-warning-900/40 to-surface-900 border-warning-600/50 shadow-lg shadow-warning-900/20'
              : 'bg-surface-900/50 border-surface-700/30 opacity-50',
          ]"
        >
          <div class="relative z-10">
            <UIcon
              :name="
                parseFloat(totalKappaTasksPercentage) >= 100
                  ? 'i-mdi-trophy'
                  : 'i-mdi-trophy-outline'
              "
              :class="[
                'w-12 h-12 mb-3',
                parseFloat(totalKappaTasksPercentage) >= 100
                  ? 'text-warning-400'
                  : 'text-surface-600',
              ]"
            />
            <div class="text-3xl font-bold text-white mb-1">
              {{ $t("page.dashboard.milestones.kappa.title") }}
            </div>
            <div class="text-xs text-surface-400 uppercase tracking-wider">
              {{ $t("page.dashboard.milestones.kappa.subtitle") }}
            </div>
          </div>
        </div>

        <!-- Lightkeeper Milestone -->
        <div
          :class="[
            'relative overflow-hidden rounded-xl p-6 border transition-all',
            parseFloat(totalLightkeeperTasksPercentage) >= 100
              ? 'bg-linear-to-br from-purple-900/40 to-surface-900 border-purple-600/50 shadow-lg shadow-purple-900/20'
              : 'bg-surface-900/50 border-surface-700/30 opacity-50',
          ]"
        >
          <div class="relative z-10">
            <UIcon
              :name="
                parseFloat(totalLightkeeperTasksPercentage) >= 100
                  ? 'i-mdi-lighthouse'
                  : 'i-mdi-lighthouse-on'
              "
              :class="[
                'w-12 h-12 mb-3',
                parseFloat(totalLightkeeperTasksPercentage) >= 100
                  ? 'text-purple-400'
                  : 'text-surface-600',
              ]"
            />
            <div class="text-3xl font-bold text-white mb-1">
              {{ $t("page.dashboard.milestones.lightkeeper.title") }}
            </div>
            <div class="text-xs text-surface-400 uppercase tracking-wider">
              {{ $t("page.dashboard.milestones.lightkeeper.subtitle") }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDashboardStats } from "@/composables/useDashboardStats";
import { useTarkovStore } from "@/stores/tarkov";

// Dashboard statistics composable
const dashboardStats = useDashboardStats();
const tarkovStore = useTarkovStore();

// Get current level
const currentLevel = computed(() => {
  const currentMode = tarkovStore.currentGameMode;
  return tarkovStore[currentMode]?.level || 1;
});

// Unwrap trader stats for template usage
const traderStats = computed(() => dashboardStats.traderStats.value || []);

// Helper function to calculate percentage
const calculatePercentage = (completed: number, total: number): string => {
  return total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";
};

// Percentage calculations
const totalTasksPercentage = computed(() =>
  calculatePercentage(
    dashboardStats.completedTasks.value,
    dashboardStats.totalTasks.value
  )
);

const totalObjectivesPercentage = computed(() =>
  calculatePercentage(
    dashboardStats.completedObjectives.value,
    dashboardStats.totalObjectives.value
  )
);

const totalTaskItemsPercentage = computed(() =>
  calculatePercentage(
    dashboardStats.completedTaskItems.value,
    dashboardStats.totalTaskItems.value
  )
);

const totalKappaTasksPercentage = computed(() =>
  calculatePercentage(
    dashboardStats.completedKappaTasks.value,
    dashboardStats.totalKappaTasks.value
  )
);

const totalLightkeeperTasksPercentage = computed(() =>
  calculatePercentage(
    dashboardStats.completedLightkeeperTasks.value,
    dashboardStats.totalLightkeeperTasks.value
  )
);

// Circle progress calculation
const circumference = 2 * Math.PI * 88; // radius = 88
const progressOffset = computed(() => {
  const progress = parseFloat(totalTasksPercentage.value) / 100;
  return circumference * (1 - progress);
});
</script>

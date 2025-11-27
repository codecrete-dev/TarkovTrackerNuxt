<template>
  <GenericCard
    :avatar="stationAvatar"
    :highlight-color="getHighlightColor()"
    :avatar-height="50"
    :fill-height="false"
    class="rounded-lg relative overflow-visible"
    header-classes="pb-2"
  >
    <template #header>
      <div class="text-xl flex items-center justify-between pb-2">
        <!-- Left side content (icon and title with level badge) -->
        <div class="flex items-center gap-3">
          <!-- Station Avatar -->
          <span
            :class="highlightClasses"
            class="inline-block px-3 py-1 rounded-br-lg shadow-lg"
          >
            <img
              :src="stationAvatar"
              :height="50"
              :style="{ height: '50px' }"
              class="pt-0 block"
            />
          </span>
          <!-- Title and Level Badge -->
          <div class="flex items-center gap-2">
            <span class="text-left inline-block leading-6">
              {{ station.name }}
            </span>
            <div
              v-if="!upgradeDisabled"
              class="px-2.5 py-0.5 rounded-md"
              :class="prerequisitesMet ? 'bg-success-500/20 border border-success-500/50' : 'bg-red-500/20 border border-red-500/50'"
            >
              <span class="text-xs font-semibold" :class="prerequisitesMet ? 'text-success-400' : 'text-red-400'">
                <template v-if="prerequisitesMet">
                  <i18n-t
                    keypath="page.hideout.stationcard.level"
                    scope="global"
                    :plural="progressStore.hideoutLevels?.[props.station.id]?.self || 0"
                  >
                    <template #level>
                      {{ progressStore.hideoutLevels?.[props.station.id]?.self || 0 }}
                    </template>
                  </i18n-t>
                </template>
                <template v-else>
                  {{ $t("page.hideout.stationcard.levelnotready") }}
                </template>
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- Divider -->
      <div class="mx-4 border-b border-surface-700"></div>
    </template>
    <template #content>
      <!-- Station description -->
      <div
        v-if="currentLevel"
        class="text-left text-sm mb-3 mx-2 text-gray-300 leading-relaxed"
      >
        {{ getStashAdjustedDescription(currentLevel.description) }}
      </div>
      <div
        v-else-if="nextLevel"
        class="text-left text-sm mb-3 mx-2 text-gray-300 leading-relaxed"
      >
        {{ getStashAdjustedDescription(nextLevel.description) }}
      </div>
      
      <!-- Stash station special content -->
      <div
        v-if="props.station.normalizedName === SPECIAL_STATIONS.STASH"
        class="text-center p-3 bg-gray-700 rounded-lg mb-3"
      >
        <div class="mb-2 text-sm">
          {{ $t("page.hideout.stationcard.gameeditiondescription") }}
        </div>
        <UButton variant="soft" to="/settings" color="white">{{
          $t("page.hideout.stationcard.settingsbutton")
        }}</UButton>
      </div>
      
      <!-- Next level requirements -->
      <div v-if="nextLevel" class="space-y-3">
        <!-- Item Requirements Section -->
        <div v-if="hasItemRequirements" class="bg-gray-800 rounded-lg p-3">
          <div
            class="text-base font-medium mb-3 flex items-center"
          >
            <UIcon
              name="i-mdi-package-variant-closed-check"
              class="mr-2 w-5 h-5 text-green-500"
            />
            {{ $t("page.hideout.stationcard.nextlevel") }}
          </div>
          
          <!-- Item Requirements Grid -->
          <div class="grid grid-cols-1 gap-3 mb-3">
            <HideoutRequirement
              v-for="requirement in nextLevel.itemRequirements"
              :key="requirement.id"
              :requirement="requirement"
              :station-id="props.station.id"
              :level="nextLevel.level"
            />
          </div>
          
          <!-- Prerequisites Section -->
          <div v-if="hasPrerequisites" class="border-t border-gray-700 pt-3 space-y-2">
            <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              {{ $t("page.hideout.stationcard.prerequisites") || "Prerequisites" }}
            </div>
            
            <!-- Station Level Requirements -->
            <div
              v-for="(requirement, rIndex) in nextLevel.stationLevelRequirements"
              :key="`station-${rIndex}`"
              class="flex items-center gap-2 text-sm"
              :class="isStationReqMet(requirement) ? 'text-gray-300' : 'text-red-400 font-semibold'"
            >
              <UIcon
                name="i-mdi-home"
                class="w-4 h-4"
                :class="isStationReqMet(requirement) ? 'text-blue-500' : 'text-red-500'"
              />
              <i18n-t
                keypath="page.hideout.stationcard.requirements.station"
                scope="global"
              >
                <template #level>
                  {{ requirement.level }}
                </template>
                <template #stationname>
                  {{ requirement.station.name }}
                </template>
              </i18n-t>
            </div>
            
            <!-- Skill Requirements -->
            <div
              v-for="(requirement, rIndex) in nextLevel.skillRequirements"
              :key="`skill-${rIndex}`"
              class="flex items-center gap-2 text-sm"
              :class="isSkillReqMet(requirement) ? 'text-gray-300' : 'text-red-400 font-semibold'"
            >
              <UIcon
                name="i-mdi-star"
                class="w-4 h-4"
                :class="isSkillReqMet(requirement) ? 'text-yellow-500' : 'text-red-500'"
              />
              <i18n-t
                keypath="page.hideout.stationcard.requirements.skill"
                scope="global"
              >
                <template #level>
                  {{ requirement.level }}
                </template>
                <template #skillname>
                  {{ requirement.name }}
                </template>
              </i18n-t>
            </div>

            <!-- Trader Requirements -->
            <div
              v-for="(requirement, rIndex) in nextLevel.traderRequirements"
              :key="`trader-${rIndex}`"
              class="flex items-center gap-2 text-sm"
              :class="isTraderReqMet(requirement) ? 'text-gray-300' : 'text-red-400 font-semibold'"
            >
              <UIcon
                name="i-mdi-account-tie"
                class="w-4 h-4"
                :class="isTraderReqMet(requirement) ? 'text-purple-500' : 'text-red-500'"
              />
              <i18n-t
                keypath="page.hideout.stationcard.requirements.trader"
                scope="global"
              >
                <template #loyaltylevel>
                  {{ requirement.value }}
                </template>
                <template #tradername>
                  {{ requirement.trader.name }}
                </template>
              </i18n-t>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Max level indicator -->
      <div v-if="!nextLevel" class="p-3 rounded bg-gray-800">
        <div
          class="text-center text-base font-medium flex items-center justify-center text-yellow-500"
        >
          <UIcon name="i-mdi-star-check" class="mr-2 w-6 h-6" />
          {{ $t("page.hideout.stationcard.maxlevel") }}
        </div>
      </div>
    </template>
    <template #footer>
      <div class="p-2">
        <div
          v-if="!upgradeDisabled"
          class="flex flex-col gap-2"
        >
          <UButton
            v-if="nextLevel?.level"
            color="success"
            variant="solid"
            size="large"
            block
            :ui="upgradeButtonUi"
            @click="upgradeStation()"
          >
            <i18n-t
              keypath="page.hideout.stationcard.upgradebutton"
              scope="global"
              :plural="nextLevel?.level"
            >
              <template #level>
                {{ nextLevel?.level }}
              </template>
            </i18n-t>
          </UButton>

          <UButton
            v-if="currentLevel && !downgradeDisabled"
            size="sm"
            block
            :ui="downgradeButtonUi"
            @click="downgradeStation()"
          >
            <i18n-t
              keypath="page.hideout.stationcard.downgradebutton"
              scope="global"
              :plural="
                (progressStore.hideoutLevels?.[props.station.id]?.self || 0) -
                1
              "
            >
              <template #level>
                {{
                  (progressStore.hideoutLevels?.[props.station.id]?.self ||
                    0) - 1
                }}
              </template>
            </i18n-t>
          </UButton>
        </div>

        <div
          v-if="upgradeDisabled"
          class="flex items-center justify-center flex-wrap gap-2"
        >
          <UButton
            v-if="currentLevel && !downgradeDisabled"
            size="sm"
            :ui="downgradeButtonUi"
            @click="downgradeStation()"
          >
            <i18n-t
              keypath="page.hideout.stationcard.downgradebutton"
              scope="global"
              :plural="
                (progressStore.hideoutLevels?.[props.station.id]?.self || 0) -
                1
              "
            >
              <template #level>
                {{
                  (progressStore.hideoutLevels?.[props.station.id]?.self ||
                    0) - 1
                }}
              </template>
            </i18n-t>
          </UButton>

          <span
            v-if="nextLevel && (!currentLevel || downgradeDisabled)"
            class="text-sm text-gray-400"
          >
            {{ t("page.hideout.stationcard.upgradeunavailable") }}
          </span>
        </div>
      </div>
    </template>
  </GenericCard>
</template>

<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useProgressStore } from "@/stores/progress";
import {
  SPECIAL_STATIONS,
} from "@/utils/constants";
import { useTarkovStore } from "@/stores/tarkov";
import { useI18n } from "vue-i18n";

const GenericCard = defineAsyncComponent(() =>
  import("@/components/ui/GenericCard.vue")
);
const HideoutRequirement = defineAsyncComponent(() =>
  import("./HideoutRequirement.vue")
);

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
});

const progressStore = useProgressStore();
const tarkovStore = useTarkovStore();
const { t } = useI18n({ useScope: "global" });
const toast = useToast();

const upgradeButtonUi = {
  base:
    "bg-success-500 hover:bg-success-600 active:bg-success-700 text-white border border-success-700",
};

const downgradeButtonUi = {
  base:
    "bg-red-900/40 hover:bg-red-900/60 active:bg-red-900/80 text-red-300 border border-red-700/50",
};

const getHighlightColor = () => {
  if (progressStore.hideoutLevels?.[props.station.id]?.self > 0) {
    return "secondary";
  } else if (!prerequisitesMet.value) {
    return "red";
  } else {
    return "green";
  }
};

const highlightClasses = computed(() => {
  const color = getHighlightColor();
  const classes = {};

  switch (color) {
    case 'green':
      classes['bg-gradient-to-r from-[rgba(1,36,0,0.15)] via-[rgba(15,121,9,0.15)] to-[rgba(0,83,0,0.15)]'] = true;
      break;
    case 'red':
      classes['bg-gradient-to-r from-[rgba(36,0,0,0.15)] via-[rgba(121,0,0,0.15)] to-[rgba(83,0,0,0.15)]'] = true;
      break;
    case 'secondary':
      classes['bg-gradient-to-br from-brand-700 via-brand-300 to-brand-500'] = true;
      break;
    default:
      classes['bg-gradient-to-br from-accent-800 via-accent-700 to-accent-600'] = true;
      break;
  }

  return classes;
});

const isStationReqMet = (requirement) => {
  const currentStationLevel = progressStore.hideoutLevels?.[requirement.station.id]?.self || 0;
  return currentStationLevel >= requirement.level;
};

const isSkillReqMet = (_requirement) => {
  // TODO: Implement skill level tracking in user state
  // For now, return true to avoid blocking upgrades based on untracked skills
  return true;
};

const isTraderReqMet = (_requirement) => {
  // TODO: Implement trader loyalty level and rep tracking in user state
  // For now, return true to avoid blocking upgrades based on untracked trader levels
  return true;
};

const prerequisitesMet = computed(() => {
  if (!nextLevel.value) return true;

  // Check station level requirements
  const stationReqsMet = nextLevel.value.stationLevelRequirements?.every((req) => {
    return isStationReqMet(req);
  }) ?? true;

  // Check skill requirements
  const skillReqsMet = nextLevel.value.skillRequirements?.every((req) => {
    return isSkillReqMet(req);
  }) ?? true;

  // Check trader requirements
  const traderReqsMet = nextLevel.value.traderRequirements?.every((req) => {
    return isTraderReqMet(req);
  }) ?? true;

  return stationReqsMet && skillReqsMet && traderReqsMet;
});

const upgradeDisabled = computed(() => {
  return nextLevel.value === null;
});

const downgradeDisabled = computed(() => {
  if (props.station.normalizedName === SPECIAL_STATIONS.STASH) {
    const currentStash =
      progressStore.hideoutLevels?.[props.station.id]?.self ?? 0;
    const editionId = tarkovStore.getGameEdition();
    const editionData = progressStore.gameEditionData.find(
      (e) => e.version === editionId
    );
    const defaultStash = editionData?.defaultStashLevel ?? 0;
    return currentStash <= defaultStash;
  }
  if (props.station.normalizedName === SPECIAL_STATIONS.CULTIST_CIRCLE) {
    const currentLevel =
      progressStore.hideoutLevels?.[props.station.id]?.self ?? 0;
    const editionId = tarkovStore.getGameEdition();
    const editionData = progressStore.gameEditionData.find(
      (e) => e.version === editionId
    );
    const defaultCultistCircle = editionData?.defaultCultistCircleLevel ?? 0;
    return currentLevel <= defaultCultistCircle;
  }
  return false;
});

const nextLevel = computed(() => {
  return (
    props.station.levels.find(
      (level) =>
        level.level ===
        (progressStore.hideoutLevels?.[props.station.id]?.self || 0) + 1
    ) || null
  );
});

const currentLevel = computed(() => {
  return (
    props.station.levels.find(
      (level) =>
        level.level === progressStore.hideoutLevels?.[props.station.id]?.self
    ) || null
  );
});

const hasItemRequirements = computed(() => {
  return nextLevel.value?.itemRequirements?.length > 0;
});

const hasPrerequisites = computed(() => {
  return (
    (nextLevel.value?.stationLevelRequirements?.length > 0) ||
    (nextLevel.value?.skillRequirements?.length > 0) ||
    (nextLevel.value?.traderRequirements?.length > 0)
  );
});

const stationAvatar = computed(() => {
  return `/img/hideout/${props.station.id}.avif`;
});

const getStashAdjustedDescription = (description) => {
  // Only modify description for stash station
  if (props.station.normalizedName !== SPECIAL_STATIONS.STASH) {
    return description;
  }
  // Check if user has an edition with max stash (Unheard editions have defaultStashLevel: 5)
  const editionId = tarkovStore.getGameEdition();
  const editionData = progressStore.gameEditionData.find(
    (e) => e.version === editionId
  );
  const hasMaxStash = (editionData?.defaultStashLevel ?? 0) >= 5;
  // For editions with max stash, show static description with 10x72
  if (hasMaxStash) {
    return "Maximum size stash (10x72)";
  }
  return description;
};

const upgradeStation = () => {
  // Store next level to a variable because it can change mid-function
  const upgradeLevel = nextLevel.value;
  tarkovStore.setHideoutModuleComplete(upgradeLevel.id);
  // For each objective, mark it as complete
  upgradeLevel.itemRequirements.forEach((o) => {
    tarkovStore.setHideoutPartComplete(o.id);
  });
  toast.add({
    title: t("page.hideout.stationcard.statusupgraded", {
      name: props.station.name,
      level: upgradeLevel.level,
    }),
    color: "green",
  });
};

const downgradeStation = () => {
  // Store current level to a variable because it can change mid-function
  const downgradeLevel = currentLevel.value;
  tarkovStore.setHideoutModuleUncomplete(downgradeLevel.id);
  // For each objective, mark it as incomplete
  downgradeLevel.itemRequirements.forEach((o) => {
    tarkovStore.setHideoutPartUncomplete(o.id);
  });
  toast.add({
    title: t("page.hideout.stationcard.statusdowngraded", {
      name: props.station.name,
      level: downgradeLevel.level,
    }),
    color: "red",
  });
};
</script>
<template>
  <KeepAlive>
    <div ref="cardRef" class="rounded mb-1" :class="itemRowClasses">
      <div class="py-2 px-3">
        <div class="flex flex-wrap mx-0">
          <div
            class="flex items-center p-0 w-9/12 md:w-1/2"
            style="overflow: -moz-hidden-unscrollable"
          >
            <span class="block">
              <GameItem
                v-if="isVisible"
                :image-item="imageItem"
                :src="imageItem?.iconLink"
                :is-visible="true"
                size="medium"
                simple-mode
              />
            </span>
            <span
              class="ml-3 flex flex-col"
              style="
                -webkit-mask-image: linear-gradient(
                  90deg,
                  #000 100%,
                  transparent
                );
                mask-image: linear-gradient(90deg, #000 100%, transparent);
              "
            >
              <span class="text-base font-semibold flex items-center">
                {{ item.name }}
                <UIcon
                  v-if="props.need.foundInRaid"
                  name="i-mdi-checkbox-marked-circle-outline"
                  class="ml-1 w-5 h-5"
                />
              </span>
              <span class="mt-1">
                <template v-if="props.need.needType == 'taskObjective'">
                  <TaskLink :task="relatedTask" />
                </template>
                <template v-else-if="props.need.needType == 'hideoutModule'">
                  <StationLink :station="relatedStation" />
                </template>
              </span>
            </span>
          </div>
          <div class="flex flex-col items-end justify-center w-3/12 md:w-1/2">
            <div v-if="smAndDown" class="block mr-2">
              <UButton
                variant="ghost"
                color="gray"
                class="p-0 px-1 m-0"
                @click="smallDialog = true"
              >
                {{ currentCount.toLocaleString() }}/{{
                  neededCount.toLocaleString()
                }}
              </UButton>
              <UModal v-model="smallDialog" :ui="{ width: 'w-11/12' }">
                <UCard>
                  <div class="flex items-end flex-col h-full">
                    <!-- Item image -->
                    <div class="flex self-stretch aspect-video min-h-[100px]">
                      <GameItem
                        v-if="imageItem"
                        :image-item="imageItem"
                        :src="imageItem.image512pxLink"
                        :is-visible="true"
                        size="large"
                        simple-mode
                      />
                    </div>
                    <div class="flex self-center items-center mt-2 mx-2">
                      <div class="text-center px-2">
                        {{ item.name }}
                      </div>
                      <UIcon
                        v-if="props.need.foundInRaid"
                        name="i-mdi-checkbox-marked-circle-outline"
                        class="ml-1 w-4 h-4"
                      />
                    </div>
                    <!-- Item need details -->
                    <div class="flex flex-col self-center mt-2 mx-2 w-full">
                      <template v-if="props.need.needType == 'taskObjective'">
                        <task-link :task="relatedTask" />
                        <RequirementInfo
                          :need-type="props.need.needType"
                          :level-required="levelRequired"
                          :locked-before="lockedBefore"
                          :player-level="tarkovStore.playerLevel()"
                        />
                      </template>
                      <template
                        v-else-if="props.need.needType == 'hideoutModule'"
                      >
                        <div class="flex justify-center mb-1 mt-1">
                          <div class="text-center">
                            <station-link
                              :station="relatedStation"
                              class="justify-center"
                            />
                          </div>
                          <div class="ml-1">
                            {{ props.need.hideoutModule.level }}
                          </div>
                        </div>
                        <RequirementInfo
                          :need-type="props.need.needType"
                          :level-required="levelRequired"
                          :locked-before="lockedBefore"
                          :player-level="tarkovStore.playerLevel()"
                          :related-station="relatedStation"
                          :hideout-level="props.need.hideoutModule.level"
                        />
                      </template>
                    </div>
                    <!-- Item count actions -->
                    <div
                      v-if="!selfCompletedNeed"
                      class="flex h-full self-stretch justify-center mt-2 mb-2 mx-2"
                    >
                      <ItemCountControls
                        :current-count="currentCount"
                        :needed-count="neededCount"
                        @decrease="$emit('decreaseCount')"
                        @increase="$emit('increaseCount')"
                        @toggle="$emit('toggleCount')"
                      />
                    </div>
                    <div
                      v-else
                      class="flex h-full self-stretch justify-center mt-2 mb-2 mx-2"
                    >
                      <TeamNeedsDisplay
                        :team-needs="teamNeeds"
                        :needed-count="neededCount"
                      />
                    </div>
                  </div>
                </UCard>
              </UModal>
            </div>
            <div v-else class="flex flex-row">
              <div v-if="mdAndUp" class="flex self-center justify-between mr-2">
                <template v-if="props.need.needType == 'taskObjective'">
                  <RequirementInfo
                    :need-type="props.need.needType"
                    :level-required="levelRequired"
                    :locked-before="lockedBefore"
                    :player-level="tarkovStore.playerLevel()"
                  />
                </template>
                <template v-else-if="props.need.needType == 'hideoutModule'">
                  <div class="flex items-center mr-2">
                    <div class="flex justify-center mb-1 mt-1">
                      <div class="text-center">
                        <station-link
                          :station="relatedStation"
                          class="justify-center"
                        />
                      </div>
                      <div class="ml-1">
                        {{ props.need.hideoutModule.level }}
                      </div>
                    </div>
                  </div>
                  <RequirementInfo
                    :need-type="props.need.needType"
                    :level-required="levelRequired"
                    :locked-before="lockedBefore"
                    :player-level="tarkovStore.playerLevel()"
                    :related-station="relatedStation"
                    :hideout-level="props.need.hideoutModule.level"
                  />
                </template>
              </div>
              <div
                v-if="!selfCompletedNeed"
                class="flex self-center justify-between mr-2"
              >
                <ItemCountControls
                  :current-count="currentCount"
                  :needed-count="neededCount"
                  @decrease="$emit('decreaseCount')"
                  @increase="$emit('increaseCount')"
                  @toggle="$emit('toggleCount')"
                />
              </div>
              <div v-else class="flex h-full self-stretch justify-center mr-2">
                <TeamNeedsDisplay
                  :team-needs="teamNeeds"
                  :needed-count="neededCount"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </KeepAlive>
</template>
<script setup>
import {
  defineAsyncComponent,
  computed,
  inject,
  ref,
  onMounted,
  onUnmounted,
} from "vue";
import { useTarkovStore } from "@/stores/tarkov";
import { useBreakpoints } from "@vueuse/core";
import ItemCountControls from "./components/ItemCountControls.vue";
import RequirementInfo from "./components/RequirementInfo.vue";
import TeamNeedsDisplay from "./components/TeamNeedsDisplay.vue";
const TaskLink = defineAsyncComponent(() =>
  import("@/features/tasks/TaskLink")
);
const StationLink = defineAsyncComponent(() =>
  import("@/features/hideout/StationLink")
);
const props = defineProps({
  need: {
    type: Object,
    required: true,
  },
});
// Define breakpoints (matching Vuetify's sm: 600px, md: 960px)
const breakpoints = useBreakpoints({
  mobile: 0,
  sm: 600,
  md: 960,
});
const smAndDown = breakpoints.smaller("sm");
const mdAndUp = breakpoints.greaterOrEqual("md");
const tarkovStore = useTarkovStore();
const smallDialog = ref(false);
const {
  selfCompletedNeed,
  relatedTask,
  relatedStation,
  lockedBefore,
  neededCount,
  currentCount,
  levelRequired,
  item,
  teamNeeds,
  imageItem,
} = inject("neededitem");
// Intersection observer for lazy loading
const cardRef = ref(null);
const isVisible = ref(false);
const observer = ref(null);
onMounted(() => {
  if (cardRef.value) {
    observer.value = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible.value = true;
          observer.value?.disconnect();
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      }
    );
    observer.value.observe(cardRef.value);
  }
});
onUnmounted(() => {
  observer.value?.disconnect();
});
const itemRowClasses = computed(() => {
  return {
    "bg-gradient-to-l from-complete to-surface":
      selfCompletedNeed.value || currentCount.value >= neededCount.value,
    "bg-gray-800": !(
      selfCompletedNeed.value || currentCount.value >= neededCount.value
    ),
  };
});
defineEmits(["decreaseCount", "increaseCount", "toggleCount"]);
</script>

import { defineStore } from "pinia";
import { useTarkovStore } from "@/stores/tarkov";
import {
  useSafeLocale,
  extractLanguageCode,
} from "@/composables/utils/i18nHelpers";
import {
  API_GAME_MODES,
  GAME_MODES,
  LOCALE_TO_API_MAPPING,
  API_SUPPORTED_LANGUAGES,
  EXCLUDED_SCAV_KARMA_TASKS,
} from "@/utils/constants";
import {
  getCachedData,
  setCachedData,
  cleanupExpiredCache,
  CACHE_CONFIG,
  type CacheType,
} from "@/utils/tarkovCache";
import {
  createGraph,
  getPredecessors,
  getSuccessors,
  getParents,
  getChildren,
  safeAddNode,
  safeAddEdge,
} from "@/utils/graphHelpers";
import type {
  TarkovDataQueryResult,
  TarkovHideoutQueryResult,
  Task,
  TaskObjective,
  TaskRequirement,
  NeededItemTaskObjective,
  ObjectiveMapInfo,
  ObjectiveGPSInfo,
  HideoutStation,
  HideoutModule,
  NeededItemHideoutModule,
  TarkovMap,
  Trader,
  PlayerLevel,
  StaticMapData,
} from "@/types/tarkov";
import type { AbstractGraph } from "graphology-types";
import mapsData from "@/composables/api/maps.json";

// Mapping from GraphQL map names to static data keys
const MAP_NAME_MAPPING: { [key: string]: string } = {
  "night factory": "factory",
  "the lab": "lab",
  "ground zero 21+": "groundzero",
  "the labyrinth": "labyrinth",
};

interface MetadataState {
  // Loading states
  loading: boolean;
  hideoutLoading: boolean;
  error: Error | null;
  hideoutError: Error | null;

  // Raw data from API
  tasks: Task[];
  hideoutStations: HideoutStation[];
  maps: TarkovMap[];
  traders: Trader[];
  playerLevels: PlayerLevel[];
  staticMapData: StaticMapData | null;

  // Processed data
  taskGraph: AbstractGraph;
  hideoutGraph: AbstractGraph;
  hideoutModules: HideoutModule[];

  // Derived data structures
  objectiveMaps: { [taskId: string]: ObjectiveMapInfo[] };
  alternativeTasks: { [taskId: string]: string[] };
  objectiveGPS: { [taskId: string]: ObjectiveGPSInfo[] };
  mapTasks: { [mapId: string]: string[] };
  neededItemTaskObjectives: NeededItemTaskObjective[];
  neededItemHideoutModules: NeededItemHideoutModule[];

  // Language and game mode
  languageCode: string;
  currentGameMode: string;
}

export const useMetadataStore = defineStore("metadata", {
  state: (): MetadataState => ({
    loading: false,
    hideoutLoading: false,
    error: null,
    hideoutError: null,

    tasks: [],
    hideoutStations: [],
    maps: [],
    traders: [],
    playerLevels: [],
    staticMapData: null,

    taskGraph: createGraph(),
    hideoutGraph: createGraph(),
    hideoutModules: [],

    objectiveMaps: {},
    alternativeTasks: {},
    objectiveGPS: {},
    mapTasks: {},
    neededItemTaskObjectives: [],
    neededItemHideoutModules: [],

    languageCode: "en",
    currentGameMode: GAME_MODES.PVP,
  }),

  getters: {
    // Computed properties for tasks
    objectives: (state): TaskObjective[] => {
      if (!state.tasks.length) return [];
      const allObjectives: TaskObjective[] = [];
      state.tasks.forEach((task) => {
        task.objectives?.forEach((obj) => {
          if (obj) {
            allObjectives.push({ ...obj, taskId: task.id });
          }
        });
      });
      return allObjectives;
    },

    enabledTasks: (state): Task[] => {
      return state.tasks.filter(
        (task) => !EXCLUDED_SCAV_KARMA_TASKS.includes(task.id)
      );
    },

    // Computed properties for maps with merged static data
    mapsWithSvg: (state): TarkovMap[] => {
      if (!state.maps.length || !state.staticMapData) {
        return [];
      }
      const mergedMaps = state.maps.map((map) => {
        const lowerCaseName = map.name.toLowerCase();
        const mapKey =
          MAP_NAME_MAPPING[lowerCaseName] ||
          lowerCaseName.replace(/\s+|\+/g, "");
        const staticData = state.staticMapData?.[mapKey];
        if (staticData?.svg) {
          return {
            ...map,
            svg: staticData.svg,
          };
        } else {
          console.warn(
            `Static SVG data not found for map: ${map.name} (lookup key: ${mapKey})`
          );
          return map;
        }
      });
      return [...mergedMaps].sort((a, b) => a.name.localeCompare(b.name));
    },

    // Computed properties for traders (sorted)
    sortedTraders: (state): Trader[] => {
      return [...state.traders].sort((a, b) => a.name.localeCompare(b.name));
    },

    // Computed properties for hideout
    stationsByName: (state): { [name: string]: HideoutStation } => {
      const stationMap: { [name: string]: HideoutStation } = {};
      state.hideoutStations.forEach((station) => {
        stationMap[station.name] = station;
        if (station.normalizedName) {
          stationMap[station.normalizedName] = station;
        }
      });
      return stationMap;
    },

    modulesByStation: (state): { [stationId: string]: HideoutModule[] } => {
      const moduleMap: { [stationId: string]: HideoutModule[] } = {};
      state.hideoutModules.forEach((module) => {
        if (!moduleMap[module.stationId]) {
          moduleMap[module.stationId] = [];
        }
        moduleMap[module.stationId]!.push(module);
      });
      return moduleMap;
    },

    maxStationLevels: (state): { [stationId: string]: number } => {
      const maxLevels: { [stationId: string]: number } = {};
      state.hideoutStations.forEach((station) => {
        maxLevels[station.id] = Math.max(
          ...station.levels.map((level) => level.level)
        );
      });
      return maxLevels;
    },

    // Player level properties
    minPlayerLevel: (state): number => {
      if (!state.playerLevels.length) return 1;
      return Math.min(...state.playerLevels.map((level) => level.level));
    },

    maxPlayerLevel: (state): number => {
      if (!state.playerLevels.length) return 79;
      return Math.max(...state.playerLevels.map((level) => level.level));
    },

    // Utility getters
    isDataLoaded: (state): boolean => {
      return (
        !state.loading &&
        !state.hideoutLoading &&
        state.tasks.length > 0 &&
        state.hideoutStations.length > 0
      );
    },
  },

  actions: {
    /**
     * Initialize the store and fetch data
     */
    async initialize() {
      this.updateLanguageAndGameMode();
      await this.loadStaticMapData();
      await this.fetchAllData();
    },

    /**
     * Update language code and game mode based on current state
     */
    updateLanguageAndGameMode() {
      const store = useTarkovStore();
      const locale = useSafeLocale();

      // Update language code
      const mappedCode = LOCALE_TO_API_MAPPING[locale.value];
      if (mappedCode) {
        this.languageCode = mappedCode;
      } else {
        this.languageCode = extractLanguageCode(locale.value, [
          ...API_SUPPORTED_LANGUAGES,
        ]);
      }

      // Update game mode
      this.currentGameMode = store.getCurrentGameMode();
    },

    /**
     * Load static map data from local source
     */
    async loadStaticMapData() {
      if (!this.staticMapData) {
        this.staticMapData = mapsData as StaticMapData;
      }
    },

    /**
     * Fetch all metadata from the API
     * @param forceRefresh - If true, bypass cache and fetch fresh data
     */
    async fetchAllData(forceRefresh = false) {
      // Run cleanup once per session
      if (typeof window !== "undefined") {
        cleanupExpiredCache().catch(console.error);
      }

      await Promise.all([
        this.fetchTasksData(forceRefresh),
        this.fetchHideoutData(forceRefresh),
      ]);
    },

    /**
     * Fetch tasks, maps, traders, and player levels data
     * Uses IndexedDB cache for client-side persistence
     */
    async fetchTasksData(forceRefresh = false) {
      this.loading = true;
      this.error = null;

      try {
        const apiGameMode =
          API_GAME_MODES[this.currentGameMode as keyof typeof API_GAME_MODES] ||
          API_GAME_MODES[GAME_MODES.PVP];

        // Step 1: Check IndexedDB cache (unless forcing refresh)
        if (!forceRefresh && typeof window !== "undefined") {
          const cached = await getCachedData<TarkovDataQueryResult>(
            "data" as CacheType,
            apiGameMode,
            this.languageCode
          );

          if (cached) {
            console.log(
              `[MetadataStore] Tasks loaded from cache: ${this.languageCode}-${apiGameMode}`
            );
            this.processTasksData(cached);
            this.loading = false;
            return;
          }
        }

        // Step 2: Fetch from server API
        console.log(
          `[MetadataStore] Fetching tasks from server: ${this.languageCode}-${apiGameMode}`
        );

        const response = (await $fetch<{
          data: TarkovDataQueryResult;
        }>("/api/tarkov/data", {
          query: {
            lang: this.languageCode,
            gameMode: apiGameMode,
          },
        })) as { data: TarkovDataQueryResult; error?: unknown };

        if (response.error) {
          throw new Error(response.error as string);
        }

        if (response?.data) {
          this.processTasksData(response.data);

          // Step 3: Store in IndexedDB for future visits
          if (typeof window !== "undefined") {
            setCachedData(
              "data" as CacheType,
              apiGameMode,
              this.languageCode,
              response.data,
              CACHE_CONFIG.DEFAULT_TTL
            ).catch(console.error);
          }
        } else {
          this.resetTasksData();
        }
      } catch (err) {
        console.error("Error fetching tasks data:", err);
        this.error = err as Error;
        this.resetTasksData();
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch hideout data
     * Uses IndexedDB cache for client-side persistence
     */
    async fetchHideoutData(forceRefresh = false) {
      this.hideoutLoading = true;
      this.hideoutError = null;

      try {
        const apiGameMode =
          API_GAME_MODES[this.currentGameMode as keyof typeof API_GAME_MODES] ||
          API_GAME_MODES[GAME_MODES.PVP];

        // Step 1: Check IndexedDB cache (unless forcing refresh)
        // Hideout data is not language-specific
        if (!forceRefresh && typeof window !== "undefined") {
          const cached = await getCachedData<TarkovHideoutQueryResult>(
            "hideout" as CacheType,
            apiGameMode,
            "en"
          );

          if (cached) {
            console.log(
              `[MetadataStore] Hideout loaded from cache: ${apiGameMode}`
            );
            this.processHideoutData(cached);
            this.hideoutLoading = false;
            return;
          }
        }

        // Step 2: Fetch from server API
        console.log(
          `[MetadataStore] Fetching hideout from server: ${apiGameMode}`
        );

        const response = (await $fetch<{
          data: TarkovHideoutQueryResult;
        }>("/api/tarkov/hideout", {
          query: {
            gameMode: apiGameMode,
          },
        })) as { data: TarkovHideoutQueryResult; error?: unknown };

        if (response.error) {
          throw new Error(response.error as string);
        }

        if (response?.data) {
          this.processHideoutData(response.data);

          // Step 3: Store in IndexedDB for future visits
          if (typeof window !== "undefined") {
            setCachedData(
              "hideout" as CacheType,
              apiGameMode,
              "en",
              response.data,
              CACHE_CONFIG.DEFAULT_TTL
            ).catch(console.error);
          }
        } else {
          this.resetHideoutData();
        }
      } catch (err) {
        console.error("Error fetching hideout data:", err);
        this.hideoutError = err as Error;
        this.resetHideoutData();
      } finally {
        this.hideoutLoading = false;
      }
    },

    /**
     * Process tasks data and build derived structures
     */
    processTasksData(data: TarkovDataQueryResult) {
      this.tasks = data.tasks || [];
      this.maps = data.maps || [];
      this.traders = data.traders || [];
      this.playerLevels = data.playerLevels || [];

      if (this.tasks.length > 0) {
        const newGraph = this.buildTaskGraph(this.tasks);
        const processedData = this.processTaskRelationships(this.tasks);
        const enhancedTasks = this.enhanceTasksWithRelationships(
          this.tasks,
          newGraph
        );

        this.tasks = enhancedTasks;
        this.taskGraph = newGraph;
        this.mapTasks = processedData.tempMapTasks;
        this.objectiveMaps = processedData.tempObjectiveMaps;
        this.objectiveGPS = processedData.tempObjectiveGPS;
        this.alternativeTasks = processedData.tempAlternativeTasks;
        this.neededItemTaskObjectives = processedData.tempNeededObjectives;
      } else {
        this.resetTasksData();
      }
    },

    /**
     * Process hideout data and build derived structures
     */
    processHideoutData(data: TarkovHideoutQueryResult) {
      this.hideoutStations = data.hideoutStations || [];

      if (this.hideoutStations.length > 0) {
        const newGraph = this.buildHideoutGraph(this.hideoutStations);
        const newModules = this.createHideoutModules(
          this.hideoutStations,
          newGraph
        );
        const newNeededItems = this.extractItemRequirements(newModules);

        this.hideoutModules = newModules;
        this.hideoutGraph = newGraph;
        this.neededItemHideoutModules = newNeededItems;
      } else {
        this.resetHideoutData();
      }
    },

    /**
     * Builds the task graph from task requirements
     */
    buildTaskGraph(taskList: Task[]): AbstractGraph {
      const newGraph = createGraph();
      const activeRequirements: { task: Task; requirement: TaskRequirement }[] =
        [];

      // Add all tasks as nodes and process non-active requirements
      taskList.forEach((task) => {
        safeAddNode(newGraph, task.id);
        task.taskRequirements?.forEach((requirement) => {
          if (requirement?.task?.id) {
            if (requirement.status?.includes("active")) {
              activeRequirements.push({ task, requirement });
            } else {
              // Ensure the required task exists before adding edge
              if (taskList.some((t) => t.id === requirement.task.id)) {
                safeAddNode(newGraph, requirement.task.id);
                safeAddEdge(newGraph, requirement.task.id, task.id);
              }
            }
          }
        });
      });

      // Handle active requirements by linking predecessors
      activeRequirements.forEach(({ task, requirement }) => {
        const requiredTaskNodeId = requirement.task.id;
        if (newGraph.hasNode(requiredTaskNodeId)) {
          const predecessors = getParents(newGraph, requiredTaskNodeId);
          predecessors.forEach((predecessorId) => {
            safeAddEdge(newGraph, predecessorId, task.id);
          });
        }
      });

      return newGraph;
    },

    /**
     * Processes tasks to extract map, GPS, and item information
     */
    processTaskRelationships(taskList: Task[]) {
      const tempMapTasks: { [mapId: string]: string[] } = {};
      const tempObjectiveMaps: { [taskId: string]: ObjectiveMapInfo[] } = {};
      const tempObjectiveGPS: { [taskId: string]: ObjectiveGPSInfo[] } = {};
      const tempAlternativeTasks: { [taskId: string]: string[] } = {};
      const tempNeededObjectives: NeededItemTaskObjective[] = [];

      taskList.forEach((task) => {
        // Process finish rewards for alternative tasks
        if (Array.isArray(task.finishRewards)) {
          task.finishRewards.forEach((reward) => {
            if (
              reward?.__typename === "QuestStatusReward" &&
              reward.status === "Fail" &&
              reward.quest?.id
            ) {
              if (!tempAlternativeTasks[reward.quest.id]) {
                tempAlternativeTasks[reward.quest.id] = [];
              }
              tempAlternativeTasks[reward.quest.id]!.push(task.id);
            }
          });
        }

        // Process objectives
        task.objectives?.forEach((objective) => {
          // Map and location data
          if (objective?.location?.id) {
            const mapId = objective.location.id;
            if (!tempMapTasks[mapId]) {
              tempMapTasks[mapId] = [];
            }
            if (!tempMapTasks[mapId].includes(task.id)) {
              tempMapTasks[mapId].push(task.id);
            }
            if (!tempObjectiveMaps[task.id]) {
              tempObjectiveMaps[task.id] = [];
            }
            tempObjectiveMaps[task.id]!.push({
              objectiveID: String(objective.id),
              mapID: String(mapId),
            });

            // GPS coordinates
            if (objective.x !== undefined && objective.y !== undefined) {
              if (!tempObjectiveGPS[task.id]) {
                tempObjectiveGPS[task.id] = [];
              }
              tempObjectiveGPS[task.id]!.push({
                objectiveID: objective.id,
                x: objective.x,
                y: objective.y,
              });
            }
          }

          // Item requirements
          // Exclude "findItem" objectives as they are passive checks that auto-complete
          // when the player acquires the items for the corresponding "giveItem" objective
          if (
            (objective?.item?.id || objective?.markerItem?.id) &&
            objective.type !== "findItem"
          ) {
            tempNeededObjectives.push({
              id: objective.id,
              needType: "taskObjective",
              taskId: task.id,
              type: objective.type,
              item: objective.item!,
              markerItem: objective.markerItem,
              count: objective.count ?? 1,
              foundInRaid: objective.foundInRaid ?? false,
            });
          }
        });
      });

      return {
        tempMapTasks,
        tempObjectiveMaps,
        tempObjectiveGPS,
        tempAlternativeTasks,
        tempNeededObjectives,
      };
    },

    /**
     * Enhances tasks with graph relationship data
     */
    enhanceTasksWithRelationships(
      taskList: Task[],
      graph: AbstractGraph
    ): Task[] {
      return taskList.map((task) => ({
        ...task,
        traderIcon: task.trader?.imageLink,
        predecessors: getPredecessors(graph, task.id),
        successors: getSuccessors(graph, task.id),
        parents: getParents(graph, task.id),
        children: getChildren(graph, task.id),
      }));
    },

    /**
     * Builds the hideout dependency graph from station level requirements
     */
    buildHideoutGraph(stations: HideoutStation[]): AbstractGraph {
      const newGraph = createGraph();
      stations.forEach((station) => {
        station.levels.forEach((level) => {
          safeAddNode(newGraph, level.id);
          level.stationLevelRequirements?.forEach((requirement) => {
            if (requirement?.station?.id) {
              // Find the required level's ID
              const requiredStation = stations.find(
                (s) => s.id === requirement.station.id
              );
              const requiredLevel = requiredStation?.levels.find(
                (l) => l.level === requirement.level
              );
              if (requiredLevel?.id) {
                safeAddNode(newGraph, requiredLevel.id);
                safeAddEdge(newGraph, requiredLevel.id, level.id);
              } else {
                console.warn(
                  `Could not find required level ID for station ${requirement.station.id} ` +
                    `level ${requirement.level} needed by ${level.id}`
                );
              }
            }
          });
        });
      });
      return newGraph;
    },

    /**
     * Converts hideout levels to modules with relationship data
     */
    createHideoutModules(
      stations: HideoutStation[],
      graph: AbstractGraph
    ): HideoutModule[] {
      const modules: HideoutModule[] = [];
      stations.forEach((station) => {
        station.levels.forEach((level) => {
          const moduleData: HideoutModule = {
            ...level,
            stationId: station.id,
            predecessors: getPredecessors(graph, level.id),
            successors: getSuccessors(graph, level.id),
            parents: getParents(graph, level.id),
            children: getChildren(graph, level.id),
          };
          modules.push(moduleData);
        });
      });
      return modules;
    },

    /**
     * Extracts item requirements from hideout modules
     */
    extractItemRequirements(
      modules: HideoutModule[]
    ): NeededItemHideoutModule[] {
      const neededItems: NeededItemHideoutModule[] = [];
      modules.forEach((module) => {
        module.itemRequirements?.forEach((req) => {
          if (req?.item?.id) {
            neededItems.push({
              id: req.id,
              needType: "hideoutModule",
              hideoutModule: { ...module },
              item: req.item,
              count: req.count,
              foundInRaid: req.foundInRaid,
            });
          }
        });
      });
      return neededItems;
    },

    /**
     * Reset tasks data to empty state
     */
    resetTasksData() {
      this.tasks = [];
      this.maps = [];
      this.traders = [];
      this.playerLevels = [];
      this.taskGraph = createGraph();
      this.objectiveMaps = {};
      this.alternativeTasks = {};
      this.objectiveGPS = {};
      this.mapTasks = {};
      this.neededItemTaskObjectives = [];
    },

    /**
     * Reset hideout data to empty state
     */
    resetHideoutData() {
      this.hideoutStations = [];
      this.hideoutModules = [];
      this.hideoutGraph = createGraph();
      this.neededItemHideoutModules = [];
    },

    // Task utility functions
    getTaskById(taskId: string): Task | undefined {
      return this.tasks.find((task) => task.id === taskId);
    },

    getTasksByTrader(traderId: string): Task[] {
      return this.tasks.filter((task) => task.trader?.id === traderId);
    },

    getTasksByMap(mapId: string): Task[] {
      const taskIds = this.mapTasks[mapId] || [];
      return this.tasks.filter((task) => taskIds.includes(task.id));
    },

    isPrerequisiteFor(taskId: string, targetTaskId: string): boolean {
      const targetTask = this.getTaskById(targetTaskId);
      return targetTask?.predecessors?.includes(taskId) ?? false;
    },

    // Trader utility functions
    getTraderById(traderId: string): Trader | undefined {
      return this.traders.find((trader) => trader.id === traderId);
    },

    getTraderByName(traderName: string): Trader | undefined {
      const lowerCaseName = traderName.toLowerCase();
      return this.traders.find(
        (trader) =>
          trader.name.toLowerCase() === lowerCaseName ||
          trader.normalizedName?.toLowerCase() === lowerCaseName
      );
    },

    // Map utility functions
    getMapById(mapId: string): TarkovMap | undefined {
      return this.maps.find((map) => map.id === mapId);
    },

    getMapByName(mapName: string): TarkovMap | undefined {
      const lowerCaseName = mapName.toLowerCase();
      return this.maps.find(
        (map) =>
          map.name.toLowerCase() === lowerCaseName ||
          map.normalizedName?.toLowerCase() === lowerCaseName
      );
    },

    getStaticMapKey(mapName: string): string {
      const lowerCaseName = mapName.toLowerCase();
      return (
        MAP_NAME_MAPPING[lowerCaseName] || lowerCaseName.replace(/\s+|\+/g, "")
      );
    },

    hasMapSvg(mapId: string): boolean {
      const map = this.getMapById(mapId);
      return !!map?.svg;
    },

    // Hideout utility functions
    getStationById(stationId: string): HideoutStation | undefined {
      return this.hideoutStations.find((station) => station.id === stationId);
    },

    getStationByName(name: string): HideoutStation | undefined {
      return this.stationsByName[name];
    },

    getModuleById(moduleId: string): HideoutModule | undefined {
      return this.hideoutModules.find((module) => module.id === moduleId);
    },

    getModulesByStation(stationId: string): HideoutModule[] {
      return this.modulesByStation[stationId] || [];
    },

    getMaxStationLevel(stationId: string): number {
      return this.maxStationLevels[stationId] || 0;
    },

    isPrerequisiteForModule(moduleId: string, targetModuleId: string): boolean {
      const targetModule = this.getModuleById(targetModuleId);
      return targetModule?.predecessors?.includes(moduleId) ?? false;
    },

    getItemsForModule(moduleId: string): NeededItemHideoutModule[] {
      return this.neededItemHideoutModules.filter(
        (item) => item.hideoutModule.id === moduleId
      );
    },

    getModulesRequiringItem(itemId: string): NeededItemHideoutModule[] {
      return this.neededItemHideoutModules.filter(
        (item) => item.item.id === itemId
      );
    },

    getTotalConstructionTime(moduleId: string): number {
      const module = this.getModuleById(moduleId);
      if (!module) return 0;
      let totalTime = module.constructionTime;
      // Add time for all prerequisite modules
      module.predecessors.forEach((prerequisiteId) => {
        const prerequisite = this.getModuleById(prerequisiteId);
        if (prerequisite) {
          totalTime += prerequisite.constructionTime;
        }
      });
      return totalTime;
    },

    /**
     * Refresh all data
     */
    async refresh() {
      this.updateLanguageAndGameMode();
      await this.fetchAllData();
    },
  },
});

// Export type for use in components
export type MetadataStore = ReturnType<typeof useMetadataStore>;

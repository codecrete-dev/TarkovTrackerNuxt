import { ref, computed, onMounted, type ComputedRef } from "vue";
import {
  useSafeLocale,
  extractLanguageCode,
} from "@/composables/utils/i18nHelpers";
import type { StaticMapData } from "@/types/tarkov";
import mapsData from "./maps.json";
import {
  API_GAME_MODES,
  GAME_MODES,
  API_SUPPORTED_LANGUAGES,
  LOCALE_TO_API_MAPPING,
} from "@/utils/constants";

// Re-export the shared query composables for convenience
// These use IndexedDB caching for client-side persistence
export {
  useSharedTarkovDataQuery,
  useSharedTarkovHideoutQuery,
} from "./useSharedTarkovQuery";

// Singleton state
const availableLanguages = ref<string[]>([...API_SUPPORTED_LANGUAGES]);
const staticMapData = ref<StaticMapData | null>(null);

// Map data - now served locally
let mapPromise: Promise<StaticMapData> | null = null;
/**
 * Loads static map data from local source
 */
async function loadStaticMaps(): Promise<StaticMapData> {
  if (!mapPromise) {
    mapPromise = Promise.resolve(mapsData as StaticMapData);
  }
  return mapPromise;
}

/**
 * Composable for managing Tarkov API queries and language detection
 */
export function useTarkovApi() {
  // Use safe locale helper to avoid i18n context issues
  const locale = useSafeLocale();
  const languageCode = computed(() => {
    // First check explicit mapping (e.g. uk -> en)
    const mappedCode = LOCALE_TO_API_MAPPING[locale.value];
    if (mappedCode) {
      return mappedCode;
    }
    // Otherwise verify against supported languages
    return extractLanguageCode(locale.value, availableLanguages.value);
  });

  // Load static map data on mount
  onMounted(async () => {
    if (!staticMapData.value) {
      staticMapData.value = await loadStaticMaps();
    }
  });

  return {
    availableLanguages: availableLanguages,
    languageCode,
    staticMapData,
    loadStaticMaps,
  };
}

/**
 * @deprecated Use useSharedTarkovDataQuery() from useSharedTarkovQuery.ts instead
 * This composable uses IndexedDB caching for client-side persistence
 *
 * Legacy composable for Tarkov main data queries (tasks, maps, traders, player levels)
 */
export function useTarkovDataQuery(
  gameMode: ComputedRef<string> = computed(() => GAME_MODES.PVP)
) {
  console.warn(
    "[useTarkovDataQuery] This composable is deprecated. " +
      "Use useSharedTarkovDataQuery() from useSharedTarkovQuery.ts instead, " +
      "which provides IndexedDB caching for faster page loads."
  );

  // Import and return the shared query
  const { useSharedTarkovDataQuery } = require("./useSharedTarkovQuery");
  return useSharedTarkovDataQuery();
}

/**
 * @deprecated Use useSharedTarkovHideoutQuery() from useSharedTarkovQuery.ts instead
 * This composable uses IndexedDB caching for client-side persistence
 *
 * Legacy composable for Tarkov hideout data queries
 */
export function useTarkovHideoutQuery(
  gameMode: ComputedRef<string> = computed(() => GAME_MODES.PVP)
) {
  console.warn(
    "[useTarkovHideoutQuery] This composable is deprecated. " +
      "Use useSharedTarkovHideoutQuery() from useSharedTarkovQuery.ts instead, " +
      "which provides IndexedDB caching for faster page loads."
  );

  // Import and return the shared query
  const { useSharedTarkovHideoutQuery } = require("./useSharedTarkovQuery");
  return useSharedTarkovHideoutQuery();
}

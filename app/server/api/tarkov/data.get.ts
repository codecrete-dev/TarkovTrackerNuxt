import { TARKOV_DATA_QUERY } from "~/server/utils/tarkov-queries";

// Supported languages by tarkov.dev API
const SUPPORTED_LANGUAGES = [
  "cs",
  "de",
  "en",
  "es",
  "fr",
  "hu",
  "it",
  "ja",
  "ko",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "tr",
  "zh",
] as const;

// Valid game modes
const VALID_GAME_MODES = ["regular", "pve"] as const;

// Cache TTL: 12 hours in seconds
const CACHE_TTL = 43200;

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // Validate and sanitize inputs
  let lang = (query.lang as string)?.toLowerCase() || "en";
  let gameMode = (query.gameMode as string)?.toLowerCase() || "regular";

  // Ensure valid language (fallback to English if unsupported)
  if (
    !SUPPORTED_LANGUAGES.includes(lang as (typeof SUPPORTED_LANGUAGES)[number])
  ) {
    lang = "en";
  }

  // Ensure valid game mode
  if (
    !VALID_GAME_MODES.includes(gameMode as (typeof VALID_GAME_MODES)[number])
  ) {
    gameMode = "regular";
  }

  // Cloudflare Workers have a special caches.default property not in standard types
  // In Node.js dev mode, caches is not defined at all
  const isCacheAvailable =
    typeof globalThis.caches !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.caches as any).default;

  try {
    // Only use Cloudflare Cache API in production (Cloudflare Pages/Workers)
    if (isCacheAvailable) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cache = (globalThis.caches as any).default as Cache;

      // Create a normalized cache key URL to ensure consistent caching
      const cacheUrl = new URL(
        `https://cache.tarkovtracker.io/api/tarkov/data`
      );
      cacheUrl.searchParams.set("lang", lang);
      cacheUrl.searchParams.set("gameMode", gameMode);
      const cacheKey = new Request(cacheUrl.toString());

      // Check cache first
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        // CACHE HIT - Return immediately
        const data = await cachedResponse.json();

        setResponseHeaders(event, {
          "X-Cache-Status": "HIT",
          "X-Cache-Key": `${lang}-${gameMode}`,
          "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
        });

        return data;
      }

      // CACHE MISS - Fetch from tarkov.dev API
      console.log(`[EDGE] Cache miss for data: ${lang}-${gameMode}`);

      const response = await $fetch("https://api.tarkov.dev/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          query: TARKOV_DATA_QUERY,
          variables: { lang, gameMode },
        },
      });

      // Store in edge cache with TTL
      const cacheResponse = new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
          "X-Cache-Status": "MISS",
          "X-Cache-Key": `${lang}-${gameMode}`,
        },
      });

      // Non-blocking cache write if waitUntil available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cfContext = (event.context as any).cloudflare?.context;
      if (cfContext?.waitUntil) {
        cfContext.waitUntil(cache.put(cacheKey, cacheResponse.clone()));
      } else {
        await cache.put(cacheKey, cacheResponse.clone());
      }

      setResponseHeaders(event, {
        "X-Cache-Status": "MISS",
        "X-Cache-Key": `${lang}-${gameMode}`,
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
      });

      return response;
    } else {
      // DEV MODE - No edge caching, direct fetch
      console.log(`[DEV] Fetching data for: ${lang}-${gameMode}`);

      const response = await $fetch("https://api.tarkov.dev/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          query: TARKOV_DATA_QUERY,
          variables: { lang, gameMode },
        },
      });

      setResponseHeaders(event, {
        "X-Cache-Status": "DEV",
        "X-Cache-Key": `${lang}-${gameMode}`,
        "Cache-Control": "no-cache",
      });

      return response;
    }
  } catch (error) {
    console.error("Error fetching data from tarkov.dev:", error);
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch data from tarkov.dev API",
    });
  }
});

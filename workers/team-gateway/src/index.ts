export interface Env {
  TEAM_GATEWAY_KV: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ALLOWED_ORIGIN?: string;
}

type TeamAction = "create" | "join" | "leave" | "kick";

const RATE_LIMITS: Record<TeamAction, { limit: number; windowSec: number }> = {
  create: { limit: 10, windowSec: 3600 }, // 10 creates/hour per ip+user
  join: { limit: 30, windowSec: 600 }, // 30 joins/10min
  leave: { limit: 30, windowSec: 3600 },
  kick: { limit: 20, windowSec: 3600 },
};

const fnMap: Record<TeamAction, string> = {
  create: "team-create",
  join: "team-join",
  leave: "team-leave",
  kick: "team-kick",
};

async function rateLimit(env: Env, key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const bucket = Math.floor(now / (windowSec * 1000));
  const kvKey = `rl:${bucket}:${key}`;
  const current = Number(await env.TEAM_GATEWAY_KV.get(kvKey)) || 0;
  if (current >= limit) {
    return false;
  }
  await env.TEAM_GATEWAY_KV.put(kvKey, String(current + 1), {
    expirationTtl: windowSec,
  });
  return true;
}

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,apikey",
  };
}

async function proxyToSupabase(
  env: Env,
  action: TeamAction,
  authHeader: string | null,
  body: Record<string, unknown>
) {
  const fnName = fnMap[action];
  const url = `${env.SUPABASE_URL}/functions/v1/${fnName}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_ANON_KEY,
  };
  if (authHeader) headers.Authorization = authHeader;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
}

async function handleAction(request: Request, env: Env, action: TeamAction) {
  const origin = env.ALLOWED_ORIGIN;
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers });
  }

  const clientIp =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";
  const key = `${action}:${clientIp}:${authHeader.slice(-24)}`;
  const { limit, windowSec } = RATE_LIMITS[action];
  const allowed = await rateLimit(env, key, limit, windowSec);
  if (!allowed) {
    return new Response("Rate limit exceeded", { status: 429, headers });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // keep empty
  }

  const resp = await proxyToSupabase(env, action, authHeader, body);
  // Apply CORS to upstream response
  const outHeaders = new Headers(resp.headers);
  Object.entries(headers).forEach(([k, v]) => outHeaders.set(k, v));
  return new Response(await resp.text(), { status: resp.status, headers: outHeaders });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Normalize trailing slash to avoid route misses (e.g., /team/create/ -> /team/create)
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/health") {
      return new Response("ok", { status: 200, headers: corsHeaders(env.ALLOWED_ORIGIN) });
    }
    if (path === "/team/create") return handleAction(request, env, "create");
    if (path === "/team/join") return handleAction(request, env, "join");
    if (path === "/team/leave") return handleAction(request, env, "leave");
    if (path === "/team/kick") return handleAction(request, env, "kick");
    return new Response("Not Found", { status: 404, headers: corsHeaders(env.ALLOWED_ORIGIN) });
  },
};

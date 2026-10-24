import { createHash, timingSafeEqual } from "node:crypto";

const devHostnames = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "flow.localhost",
]);

const unavailable = {
  message: "This service is not available.",
  ok: false as const,
  status: 503 as const,
};

export type McpAccessDecision =
  | {
      corsOrigin: string | null;
      mode: "bearer" | "development" | "public-read-only";
      ok: true;
    }
  | { message: string; ok: false; status: 401 | 403 | 503 };

interface McpConfig {
  allowedOrigins: string[];
  appOrigin: string | null;
  appHostname: string | null;
  bearer: string | null;
  mode: "bearer" | "development" | "public-read-only";
}

const parseExactOrigin = (value: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.pathname !== "/" && url.pathname !== "") return null;
  if (url.search || url.hash) return null;
  if (url.origin !== value) return null;
  return url;
};

const parseAllowedOrigins = (value: string | undefined) => {
  const raw = value?.trim() ?? "";
  if (!raw) return { ok: true as const, origins: [] as string[] };
  const origins: string[] = [];
  for (const part of raw.split(",")) {
    const candidate = part.trim();
    if (!candidate) continue;
    if (candidate.includes("*"))
      return { ok: false as const, reason: "wildcard_origin" as const };
    const url = parseExactOrigin(candidate);
    if (!url) return { ok: false as const, reason: "invalid_origin" as const };
    origins.push(url.origin);
  }
  return { ok: true as const, origins };
};

const readMcpConfig = (
  env: NodeJS.ProcessEnv
): { config: McpConfig; ok: true } | { ok: false } => {
  const origins = parseAllowedOrigins(env.CONSULTANT_MCP_ALLOWED_ORIGINS);
  if (!origins.ok) return { ok: false };

  const appOriginRaw = env.APP_ORIGIN?.trim() ?? "";
  const appUrl = appOriginRaw ? parseExactOrigin(appOriginRaw) : null;
  if (appOriginRaw && !appUrl) return { ok: false };

  const bearer = env.CONSULTANT_MCP_BEARER?.trim() ?? "";
  const production = env.NODE_ENV === "production";

  if (!production) {
    return {
      config: {
        allowedOrigins: origins.origins,
        appHostname: appUrl?.hostname.toLowerCase() ?? null,
        appOrigin: appUrl?.origin ?? null,
        bearer: bearer || null,
        mode: "development",
      },
      ok: true,
    };
  }

  if (!appUrl) return { ok: false };
  if (bearer) {
    return {
      config: {
        allowedOrigins: origins.origins,
        appHostname: appUrl.hostname.toLowerCase(),
        appOrigin: appUrl.origin,
        bearer,
        mode: "bearer",
      },
      ok: true,
    };
  }
  if (env.CONSULTANT_MCP_PUBLIC_READ_ONLY === "1") {
    return {
      config: {
        allowedOrigins: origins.origins,
        appHostname: appUrl.hostname.toLowerCase(),
        appOrigin: appUrl.origin,
        bearer: null,
        mode: "public-read-only",
      },
      ok: true,
    };
  }
  return { ok: false };
};

const hostnameFromHostHeader = (host: string) => {
  const trimmed = host.trim().toLowerCase();
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    return end === -1 ? trimmed : trimmed.slice(1, end);
  }
  const [hostname] = trimmed.split(":");
  return hostname ?? trimmed;
};

const hostAllowed = ({ config, host }: { config: McpConfig; host: string }) => {
  const normalized = host.toLowerCase();
  if (config.mode === "development")
    return devHostnames.has(normalized) || normalized === config.appHostname;
  return normalized === config.appHostname;
};

const originAllowed = ({
  config,
  origin,
}: {
  config: McpConfig;
  origin: string;
}) => {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false;
  if (
    config.mode === "development" &&
    devHostnames.has(url.hostname.toLowerCase())
  )
    return true;
  if (config.appOrigin && url.origin === config.appOrigin) return true;
  return config.allowedOrigins.includes(url.origin);
};

export const bearerMatches = ({
  expected,
  header,
}: {
  expected: string;
  header: string | null;
}) => {
  const presented = header?.trim() ?? "";
  const prefix = "Bearer ";
  const provided = presented.startsWith(prefix)
    ? presented.slice(prefix.length)
    : "";
  const expectedDigest = createHash("sha256").update(expected).digest();
  const providedDigest = createHash("sha256").update(provided).digest();
  const matches = timingSafeEqual(expectedDigest, providedDigest);
  return presented.startsWith(prefix) && matches;
};

const requestHosts = (request: Request) => {
  const hosts = [new URL(request.url).hostname.toLowerCase()];
  const header = request.headers.get("host");
  if (header) hosts.push(hostnameFromHostHeader(header));
  return hosts;
};

export const authorizeMcpAccess = ({
  env,
  request,
}: {
  env: NodeJS.ProcessEnv;
  request: Request;
}): McpAccessDecision => {
  const config = readMcpConfig(env);
  if (!config.ok) return unavailable;

  const origin = request.headers.get("origin");
  if (origin && !originAllowed({ config: config.config, origin }))
    return { message: "Forbidden.", ok: false, status: 403 };

  if (
    requestHosts(request).some(
      (host) => !hostAllowed({ config: config.config, host })
    )
  )
    return { message: "Forbidden.", ok: false, status: 403 };

  if (
    config.config.mode === "bearer" &&
    !(
      config.config.bearer &&
      bearerMatches({
        expected: config.config.bearer,
        header: request.headers.get("authorization"),
      })
    )
  )
    return { message: "Unauthorized.", ok: false, status: 401 };

  return {
    corsOrigin: origin,
    mode: config.config.mode,
    ok: true,
  };
};

export const mcpCorsHeaders = (origin: string) => ({
  "access-control-allow-headers":
    "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-origin": origin,
  vary: "Origin",
});

export const withMcpCors = ({
  origin,
  response,
}: {
  origin: string | null;
  response: Response;
}) => {
  if (!origin) return response;
  for (const [key, value] of Object.entries(mcpCorsHeaders(origin)))
    response.headers.set(key, value);
  return response;
};

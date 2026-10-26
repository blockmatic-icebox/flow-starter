import { jsonError } from "@/lib/api/json-error";

const windowMs = 60_000;
const maxPerWindow = 120;

const buckets = new Map<string, { count: number; resetAt: number }>();

const clientKey = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  request.headers.get("x-real-ip") ??
  "local";

export const checkMcpRateLimit = (request: Request) => {
  const key = clientKey(request);
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count > maxPerWindow)
    return jsonError({
      code: "rate_limited",
      message: "Too many MCP requests from this client.",
      resolution: "Wait one minute and retry.",
      status: 429,
    });
  return null;
};

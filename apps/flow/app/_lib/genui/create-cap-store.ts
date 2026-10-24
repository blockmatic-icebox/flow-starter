import { Redis } from "@upstash/redis";

import { sharedMemoryCapStore } from "./cap-store";
import type { CapStore } from "./cap-store";
import { redisCapStore } from "./redis-cap-store";
import type { RedisEvalClient } from "./redis-cap-store";

export type CreateCapStoreResult =
  | { mode: "memory" | "redis"; ok: true; store: CapStore }
  | { ok: false; reason: "missing_redis_config" | "redis_unavailable" };

const configured = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

const defaultCreateRedis = ({ token, url }: { token: string; url: string }) =>
  new Redis({ token, url });

let cachedProductionRedis: { cacheKey: string; store: CapStore } | undefined;

export const createCapStore = ({
  createRedis = defaultCreateRedis,
  env = process.env,
}: {
  createRedis?: (input: { token: string; url: string }) => RedisEvalClient;
  env?: NodeJS.ProcessEnv;
} = {}): CreateCapStoreResult => {
  if (env.NODE_ENV !== "production")
    return { mode: "memory", ok: true, store: sharedMemoryCapStore() };

  const url = configured(env.UPSTASH_REDIS_REST_URL);
  const token = configured(env.UPSTASH_REDIS_REST_TOKEN);
  if (!url || !token) return { ok: false, reason: "missing_redis_config" };

  const cacheKey = `${url}\0${token}`;
  const useProductionCache = createRedis === defaultCreateRedis;
  if (useProductionCache && cachedProductionRedis?.cacheKey === cacheKey) {
    return {
      mode: "redis",
      ok: true,
      store: cachedProductionRedis.store,
    };
  }

  try {
    const store = redisCapStore({ redis: createRedis({ token, url }) });
    if (useProductionCache) cachedProductionRedis = { cacheKey, store };
    return {
      mode: "redis",
      ok: true,
      store,
    };
  } catch {
    return { ok: false, reason: "redis_unavailable" };
  }
};

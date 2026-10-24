import type { CapStore } from "./cap-store";

export const COMPOSE_DAILY_LIMIT = 60;
export const CHAT_DAILY_LIMIT = 120;

export const utcDay = (now: Date) => now.toISOString().slice(0, 10);

export const capTtlSeconds = (now: Date) => {
  const nextUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(
    60,
    Math.ceil((nextUtcMidnight - now.getTime()) / 1000) + 3600
  );
};

export const admitDaily = async ({
  limit,
  namespace,
  now,
  store,
  subject,
  exceededMessage,
}: {
  exceededMessage: string;
  limit: number;
  namespace: string;
  now: Date;
  store: CapStore;
  subject: string;
}) => {
  const key = `${namespace}:${subject}:${utcDay(now)}`;
  const count = await store.increment({ key, ttlSeconds: capTtlSeconds(now) });
  if (count > limit) return { message: exceededMessage, ok: false as const };
  return { message: "", ok: true as const };
};

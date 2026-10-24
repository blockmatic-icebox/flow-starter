import type { CapStore } from "./cap-store";

const COMPOSE_DAILY_LIMIT = 60;

const utcDay = (now: Date) => now.toISOString().slice(0, 10);

export const admitCompose = async ({
  enforce = true,
  ip,
  now,
  store,
}: {
  enforce?: boolean;
  ip: string;
  now: Date;
  store: CapStore;
}) => {
  if (!enforce) return { message: "", ok: true as const };
  const key = `genui:compose:ip:${ip}:${utcDay(now)}`;
  const count = await store.incr(key);
  if (count > COMPOSE_DAILY_LIMIT) {
    return {
      message: "Too many compose requests for today. Try again tomorrow.",
      ok: false as const,
    };
  }
  return { message: "", ok: true as const };
};

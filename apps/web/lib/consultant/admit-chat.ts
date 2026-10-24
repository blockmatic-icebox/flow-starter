import type { CapStore } from "@/lib/genui/cap-store";

const CHAT_DAILY_LIMIT = 120;

const utcDay = (now: Date) => now.toISOString().slice(0, 10);

export const admitChat = async ({
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
  const key = `consultant:chat:ip:${ip}:${utcDay(now)}`;
  const count = await store.incr(key);
  if (count > CHAT_DAILY_LIMIT) {
    return {
      message: "Too many consultant requests for today. Try again tomorrow.",
      ok: false as const,
    };
  }
  return { message: "", ok: true as const };
};

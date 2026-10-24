import { admitDaily, CHAT_DAILY_LIMIT } from "@/app/_lib/genui/admit-daily";
import type { CapStore } from "@/app/_lib/genui/cap-store";

export const admitChat = ({
  enforce = true,
  now,
  store,
  subject,
}: {
  enforce?: boolean;
  now: Date;
  store: CapStore;
  subject: string;
}) => {
  if (!enforce) return { message: "", ok: true as const };
  return admitDaily({
    exceededMessage:
      "Too many consultant requests for today. Try again tomorrow.",
    limit: CHAT_DAILY_LIMIT,
    namespace: "consultant:chat",
    now,
    store,
    subject,
  });
};

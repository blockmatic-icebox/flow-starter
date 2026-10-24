import {
  admitDailyWithGlobalCost,
  CHAT_DAILY_LIMIT,
  GLOBAL_CHAT_COST_LIMIT,
} from "@/app/_lib/genui/admit-daily";
import type { CapStore } from "@/app/_lib/genui/cap-store";

export const admitChat = ({
  now,
  store,
  subject,
}: {
  now: Date;
  store: CapStore;
  subject: string;
}) =>
  admitDailyWithGlobalCost({
    exceededMessage:
      "Too many consultant requests for today. Try again tomorrow.",
    globalLimit: GLOBAL_CHAT_COST_LIMIT,
    globalNamespace: "consultant:chat",
    limit: CHAT_DAILY_LIMIT,
    namespace: "consultant:chat",
    now,
    store,
    subject,
  });

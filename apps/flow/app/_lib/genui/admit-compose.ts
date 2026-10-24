import {
  admitDailyWithGlobalCost,
  COMPOSE_DAILY_LIMIT,
  GLOBAL_COMPOSE_COST_LIMIT,
} from "./admit-daily";
import type { CapStore } from "./cap-store";

export const admitCompose = ({
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
  return admitDailyWithGlobalCost({
    exceededMessage: "Too many compose requests for today. Try again tomorrow.",
    globalLimit: GLOBAL_COMPOSE_COST_LIMIT,
    globalNamespace: "genui:compose",
    limit: COMPOSE_DAILY_LIMIT,
    namespace: "genui:compose",
    now,
    store,
    subject,
  });
};

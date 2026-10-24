import { admitDaily, COMPOSE_DAILY_LIMIT } from "./admit-daily";
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
  return admitDaily({
    exceededMessage: "Too many compose requests for today. Try again tomorrow.",
    limit: COMPOSE_DAILY_LIMIT,
    namespace: "genui:compose",
    now,
    store,
    subject,
  });
};

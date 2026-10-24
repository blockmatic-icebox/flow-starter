import { admitChat } from "@/lib/consultant/admit-chat";

import { admitCompose } from "./admit-compose";
import { CapStoreUnavailableError } from "./cap-store";
import { createCapStore } from "./create-cap-store";
import type { CreateCapStoreResult } from "./create-cap-store";
import { rateLimitEnforced, rateLimitSubject } from "./request";

const unavailable = {
  message: "This service is not available.",
  ok: false as const,
  status: 503 as const,
};

export const enforceDailyCap = async ({
  createStore = createCapStore,
  env = process.env,
  kind,
  now,
  request,
}: {
  createStore?: (input: { env: NodeJS.ProcessEnv }) => CreateCapStoreResult;
  env?: NodeJS.ProcessEnv;
  kind: "chat" | "compose";
  now: Date;
  request: Request;
}) => {
  const enforce = rateLimitEnforced({ env });
  if (!enforce && env.NODE_ENV !== "production") return { ok: true as const };

  const created = createStore({ env });
  if (!created.ok) return unavailable;
  if (!enforce) return { ok: true as const };

  try {
    const admitted = await (kind === "compose" ? admitCompose : admitChat)({
      enforce: true,
      now,
      store: created.store,
      subject: rateLimitSubject({ env, request }),
    });
    if (!admitted.ok)
      return {
        message: admitted.message,
        ok: false as const,
        status: 429 as const,
      };
    return { ok: true as const };
  } catch (error) {
    if (error instanceof CapStoreUnavailableError) return unavailable;
    throw error;
  }
};

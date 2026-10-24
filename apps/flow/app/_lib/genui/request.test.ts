import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { admitCompose } from "./admit-compose";
import { COMPOSE_DAILY_LIMIT, GLOBAL_COMPOSE_COST_LIMIT } from "./admit-daily";
import { memoryCapStore } from "./cap-store";
import { enforceDailyCap } from "./enforce-daily-cap";
import { rateLimitIdentity, rateLimitSubject } from "./request";

const trustedEnv = {
  GENUI_ENFORCE_RATE_LIMIT: "1",
  NODE_ENV: "test",
  RATE_LIMIT_TRUSTED_IP_HEADER: "x-real-ip",
} as const satisfies NodeJS.ProcessEnv;

const admitComposeTimes = async ({
  count,
  now,
  store,
  subject,
}: {
  count: number;
  now: Date;
  store: ReturnType<typeof memoryCapStore>;
  subject: string;
}) => {
  if (count <= 0) return;
  const admitted = await admitCompose({ now, store, subject });
  assert.equal(admitted.ok, true);
  return admitComposeTimes({ count: count - 1, now, store, subject });
};

describe("rateLimitIdentity", () => {
  it("isolates subjects when the trusted header is configured", async () => {
    const store = memoryCapStore();
    const now = new Date("2026-10-24T12:00:00.000Z");
    const first = rateLimitIdentity({
      env: trustedEnv,
      request: new Request("http://127.0.0.1/", {
        headers: { "x-real-ip": "203.0.113.1" },
      }),
    });
    const second = rateLimitIdentity({
      env: trustedEnv,
      request: new Request("http://127.0.0.1/", {
        headers: { "x-real-ip": "203.0.113.2" },
      }),
    });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    await admitComposeTimes({
      count: COMPOSE_DAILY_LIMIT,
      now,
      store,
      subject: first.subject,
    });
    const blocked = await admitCompose({
      now,
      store,
      subject: first.subject,
    });
    const other = await admitCompose({
      now,
      store,
      subject: second.subject,
    });
    assert.equal(blocked.ok, false);
    assert.equal(other.ok, true);
  });

  it("does not trust x-forwarded-for without configuration", () => {
    const subject = rateLimitSubject({
      env: trustedEnv,
      request: new Request("http://127.0.0.1/", {
        headers: { "x-forwarded-for": "203.0.113.9" },
      }),
    });
    assert.equal(subject, "shared");
  });

  it("fails closed when enforcement is on but identity is missing", async () => {
    const admitted = await enforceDailyCap({
      createStore: () => ({
        mode: "memory",
        ok: true,
        store: memoryCapStore(),
      }),
      env: trustedEnv,
      kind: "compose",
      now: new Date("2026-10-24T12:00:00.000Z"),
      request: new Request("http://127.0.0.1/api/genui/compose", {
        method: "POST",
      }),
    });
    assert.equal(admitted.ok, false);
    if (admitted.ok) return;
    assert.equal(admitted.status, 503);
  });

  it("blocks a second subject when the global compose cost ceiling is reached", async () => {
    const store = memoryCapStore();
    const now = new Date("2026-10-24T12:00:00.000Z");
    const fillGlobalCost = async (remaining: number) => {
      if (remaining <= 0) return;
      const admitted = await admitCompose({
        now,
        store,
        subject: `203.0.113.${remaining % 200}`,
      });
      assert.equal(admitted.ok, true);
      return fillGlobalCost(remaining - 1);
    };
    await fillGlobalCost(GLOBAL_COMPOSE_COST_LIMIT);
    const blocked = await admitCompose({
      now,
      store,
      subject: "203.0.113.250",
    });
    assert.equal(blocked.ok, false);
  });
});

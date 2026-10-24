import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { admitChat } from "../flow-agent/admit-chat";
import { admitCompose } from "./admit-compose";
import { CHAT_DAILY_LIMIT, COMPOSE_DAILY_LIMIT } from "./admit-daily";
import {
  CapStoreUnavailableError,
  memoryCapStore,
  resetSharedMemoryCapStore,
} from "./cap-store";
import { createCapStore } from "./create-cap-store";
import { dailyIncrementScript, redisCapStore } from "./redis-cap-store";

describe("cap stores", () => {
  it("counts concurrent increments", async () => {
    const store = memoryCapStore();
    const counts = await Promise.all(
      Array.from({ length: 20 }, () =>
        store.increment({ key: "shared", ttlSeconds: 60 })
      )
    );
    assert.equal(Math.max(...counts), 20);
    assert.equal(new Set(counts).size, 20);
  });

  it("blocks a daily quota and resets on the next UTC day", async () => {
    const store = memoryCapStore();
    const first = new Date("2026-10-24T23:30:00.000Z");
    const next = new Date("2026-10-25T00:30:00.000Z");
    for (let count = 0; count < COMPOSE_DAILY_LIMIT; count += 1) {
      const admitted = await admitCompose({
        now: first,
        store,
        subject: "shared",
      });
      assert.equal(admitted.ok, true);
    }
    const blocked = await admitCompose({
      now: first,
      store,
      subject: "shared",
    });
    assert.equal(blocked.ok, false);
    const rolled = await admitCompose({ now: next, store, subject: "shared" });
    assert.equal(rolled.ok, true);
  });

  it("keeps chat and compose quotas distinct", async () => {
    const store = memoryCapStore();
    const now = new Date("2026-10-24T12:00:00.000Z");
    for (let count = 0; count < COMPOSE_DAILY_LIMIT; count += 1)
      await admitCompose({ now, store, subject: "shared" });
    const chat = await admitChat({ now, store, subject: "shared" });
    assert.equal(chat.ok, true);
    assert.ok(CHAT_DAILY_LIMIT > COMPOSE_DAILY_LIMIT);
  });

  it("expires a counter after its ttl", async () => {
    let time = 1000;
    const store = memoryCapStore({ now: () => time });
    assert.equal(await store.increment({ key: "day", ttlSeconds: 10 }), 1);
    assert.equal(await store.increment({ key: "day", ttlSeconds: 10 }), 2);
    time = 12_000;
    assert.equal(await store.increment({ key: "day", ttlSeconds: 10 }), 1);
  });

  it("requires Redis configuration in production", () => {
    const missing = createCapStore({ env: { NODE_ENV: "production" } });
    assert.equal(missing.ok, false);
  });

  it("maps Redis failures and does not fall back to memory", async () => {
    const failing = redisCapStore({
      redis: {
        eval: () => Promise.reject(new Error("redis down")),
      },
    });
    await assert.rejects(
      () => failing.increment({ key: "day", ttlSeconds: 30 }),
      CapStoreUnavailableError
    );

    const created = createCapStore({
      createRedis: () => {
        throw new Error("constructor failed");
      },
      env: {
        NODE_ENV: "production",
        UPSTASH_REDIS_REST_TOKEN: "token",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      },
    });
    assert.equal(created.ok, false);
    if (!created.ok) assert.equal(created.reason, "redis_unavailable");
  });

  it("uses one atomic Redis script and stays on Redis in production", async () => {
    assert.match(dailyIncrementScript, /INCR/u);
    assert.match(dailyIncrementScript, /EXPIRE/u);
    let calls = 0;
    const created = createCapStore({
      createRedis: () => ({
        eval: (_script, keys) => {
          calls += 1;
          assert.equal(keys.length, 1);
          return Promise.resolve(calls);
        },
      }),
      env: {
        NODE_ENV: "production",
        UPSTASH_REDIS_REST_TOKEN: "token",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      },
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.mode, "redis");
    assert.equal(
      await created.store.increment({ key: "k", ttlSeconds: 30 }),
      1
    );
  });

  it("uses a shared memory store in local development", async () => {
    resetSharedMemoryCapStore();
    const first = createCapStore({ env: { NODE_ENV: "development" } });
    const second = createCapStore({
      env: {
        NODE_ENV: "development",
        UPSTASH_REDIS_REST_TOKEN: "token",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      },
    });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    assert.equal(first.mode, "memory");
    assert.equal(
      await first.store.increment({ key: "local", ttlSeconds: 30 }),
      1
    );
    assert.equal(
      await second.store.increment({ key: "local", ttlSeconds: 30 }),
      2
    );
  });
});

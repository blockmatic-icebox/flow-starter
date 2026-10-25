import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

import { mapWithConcurrency } from "./concurrency.ts";

describe("mapWithConcurrency", () => {
  it("runs workers with overlap when concurrency > 1", async () => {
    const active = new Set<number>();
    let maxActive = 0;
    const items = [1, 2, 3, 4];
    await mapWithConcurrency({
      concurrency: 2,
      items,
      worker: async (item) => {
        active.add(item);
        maxActive = Math.max(maxActive, active.size);
        await sleep(30);
        active.delete(item);
        return item;
      },
    });
    assert.ok(maxActive >= 2);
  });
});

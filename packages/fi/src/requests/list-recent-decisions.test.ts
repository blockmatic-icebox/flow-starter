import { describe, it } from "node:test";

describe("listRecentDecisions", () => {
  it("module exports listRecentDecisions", async () => {
    const mod = await import("./list-recent-decisions.ts");
    if (typeof mod.listRecentDecisions !== "function")
      throw new Error("missing export");
  });
});

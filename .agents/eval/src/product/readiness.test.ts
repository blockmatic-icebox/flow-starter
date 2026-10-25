import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runMutationIntegrity, runOfflineBenchmark } from "./mutations.ts";
import { evaluateReadiness } from "./readiness.ts";

describe("product readiness", () => {
  it("evaluates engineering evidence from allowlisted commands", () => {
    const readiness = evaluateReadiness({
      caseIds: ["flow-eval-unit"],
      runId: "readiness-test",
    });
    assert.equal(readiness.engineering, "PASS");
    assert.ok(readiness.evidence.length >= 1);
  });
});

describe("mutation integrity", () => {
  it("detects broken and passing listings sort variants", () => {
    const result = runMutationIntegrity();
    assert.equal(result.ok, true);
  });
});

describe("offline benchmarks", () => {
  it("runs benchmark A and B fixtures", () => {
    const a = runOfflineBenchmark({ benchmarkId: "benchmark-a" });
    const b = runOfflineBenchmark({ benchmarkId: "benchmark-b" });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
  });
});

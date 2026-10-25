import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { loadPublicScenario, loadScenarioOracle } from "./scenarios.ts";
import { gradeObservedScenario } from "./session-grade.ts";
import { resolveScenarioCompleteness } from "./trace.ts";
import type { EvalEvent } from "./types.ts";

const fixtureWorktree = path.join(
  fileURLToPath(new URL("..", import.meta.url)),
  "fixtures/worktrees/S13"
);

const successTurnEvents = (): EvalEvent[] => [
  {
    command: "pnpm test",
    exitCode: 0,
    id: "c1",
    kind: "command",
    origin: "observed",
    scenarioId: "S13",
    seq: 1,
    ts: "2026-01-01T00:00:00.000Z",
    turn: 1,
  },
  {
    id: "r1",
    kind: "result",
    origin: "observed",
    rawSubtype: "success",
    scenarioId: "S13",
    seq: 2,
    ts: "2026-01-01T00:00:01.000Z",
    turn: 1,
  },
  {
    id: "t1",
    kind: "tool",
    name: "readToolCall",
    origin: "observed",
    path: ".agents/skills/flow/SKILL.md",
    scenarioId: "S13",
    seq: 3,
    ts: "2026-01-01T00:00:02.000Z",
    turn: 1,
  },
];

describe("resolveScenarioCompleteness", () => {
  it("marks one fully observed official turn complete", () => {
    const events = successTurnEvents();
    assert.equal(
      resolveScenarioCompleteness({
        events,
        official: true,
        oracle: loadScenarioOracle({ id: "S13" }),
      }),
      "complete"
    );
  });

  it("keeps dry-runs partial", () => {
    assert.equal(
      resolveScenarioCompleteness({
        events: successTurnEvents(),
        official: false,
        oracle: loadScenarioOracle({ id: "S13" }),
      }),
      "partial"
    );
  });
});

describe("gradeObservedScenario product outcome", () => {
  it("fails reversed sort in fixture worktree", () => {
    const grade = gradeObservedScenario({
      card: loadPublicScenario({ id: "S13" }),
      diff: "diff --git a/packages/genui/src/listings-sort.ts",
      events: successTurnEvents(),
      harness: "cursor-cli",
      official: true,
      oracle: loadScenarioOracle({ id: "S13" }),
      protocolVerified: true,
      scenarioId: "S13",
      worktreePath: fixtureWorktree,
    });
    assert.equal(grade.productOutcomePassed, false);
    assert.ok(grade.gateIds.includes("product-outcome-failure"));
  });
});

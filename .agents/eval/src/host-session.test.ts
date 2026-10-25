import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  hostSessionFinalize,
  hostSessionNext,
  hostSessionRecord,
  prepareHostRun,
} from "./host-session.ts";
import { repoRoot } from "./paths.ts";
import type { EvalEvent } from "./types.ts";

const assertNoPinnedAgent = (relativePath: string) => {
  const source = readFileSync(path.join(repoRoot, relativePath), "utf-8");
  assert.doesNotMatch(source, /push\("--model"/u);
  assert.doesNotMatch(source, /composer-2\.5/u);
};

describe("host-session eval harness", () => {
  it("next without record returns awaiting-record not scenario-done", () => {
    const runId = `test-awaiting-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const turn = hostSessionNext({ runId, scenarioId: "S01", repetition: 1 });
    assert.equal(turn.ok, true);
    if (!turn.ok || turn.status !== "turn") return;
    const again = hostSessionNext({ runId, scenarioId: "S01", repetition: 1 });
    assert.equal(again.ok, true);
    assert.equal(again.status, "awaiting-record");
    if (again.status === "awaiting-record")
      assert.equal(again.packet.turn, turn.packet.turn);
  });

  it("record rejects empty events", () => {
    const runId = `test-record-empty-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const turn = hostSessionNext({ runId, scenarioId: "S01", repetition: 1 });
    assert.equal(turn.ok, true);
    if (!turn.ok || turn.status !== "turn") return;
    const recorded = hostSessionRecord({
      events: [],
      repetition: 1,
      runId,
      scenarioId: "S01",
      turn: turn.packet.turn,
    });
    assert.equal(recorded.ok, false);
  });

  it("prepare writes state without spawning agent", () => {
    const runId = `test-prepare-${Date.now()}`;
    const prep = prepareHostRun({
      arm: "flow",
      runId,
      scenarioIds: ["S01"],
    });
    assert.equal(prep.ok, true);
    const next = hostSessionNext({ runId });
    assert.equal(next.ok, true);
    if (!next.ok || next.status !== "turn") return;
    assert.ok(next.packet?.worktreePath?.length);
    assert.match(next.packet?.prompt ?? "", /./u);
  });

  it("finalize marks complete host-session transcript official", () => {
    const runId = `test-finalize-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const turn = hostSessionNext({ runId });
    assert.equal(turn.ok, true);
    if (!turn.ok || turn.status !== "turn") return;
    const assistant: EvalEvent[] = [
      {
        id: "a1",
        kind: "assistant",
        origin: "observed",
        scenarioId: "S01",
        seq: 2,
        text: "I will explore requirements before any build.",
        ts: new Date().toISOString(),
        turn: turn.packet.turn,
      },
    ];
    const recorded = hostSessionRecord({
      events: assistant,
      repetition: 1,
      runId,
      scenarioId: "S01",
      turn: turn.packet.turn,
    });
    assert.equal(recorded.ok, true);
    while (true) {
      const n = hostSessionNext({ runId });
      if (!n.ok || n.status !== "turn") break;
      hostSessionRecord({
        events: [
          {
            id: `a-${n.packet.turn}`,
            kind: "assistant",
            origin: "observed",
            scenarioId: "S01",
            seq: n.packet.turn * 2,
            text: "Continuing exploration without unauthorized build.",
            ts: new Date().toISOString(),
            turn: n.packet.turn,
          },
        ],
        repetition: 1,
        runId,
        scenarioId: "S01",
        turn: n.packet.turn,
      });
    }
    const finalized = hostSessionFinalize({ runId });
    assert.equal(finalized.ok, true);
    if (!finalized.ok) return;
    assert.equal(finalized.manifest.harness, "host-session");
    assert.ok(finalized.grades.length >= 1);
    assert.equal(finalized.grades[0]?.officialEligible, true);
  });

  it("cli and repair sources do not pin model or composer-2.5", () => {
    assertNoPinnedAgent(".agents/eval/src/cli.ts");
    assertNoPinnedAgent(".agents/eval/src/agent.ts");
    assertNoPinnedAgent(".agents/eval/src/product/repair-executor.ts");
  });

  it("worktree host still uses real agent list-models check", () => {
    const hostSource = readFileSync(
      path.join(repoRoot, ".agents/tooling/worktrees/host.mjs"),
      "utf-8"
    );
    assert.match(hostSource, /--list-models/u);
  });
});

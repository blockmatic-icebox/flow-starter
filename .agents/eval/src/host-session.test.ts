import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import type { GeneratedScenario } from "./generation/types.ts";
import {
  hostSessionFinalize,
  hostSessionNext,
  hostSessionObserve,
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

  it("observe accepts runner observed commands after record", () => {
    const runId = `test-observe-${Date.now()}`;
    prepareHostRun({
      arm: "flow",
      host: "cursor",
      runId,
      scenarioIds: ["S02"],
    });
    const turn = hostSessionNext({
      repetition: 1,
      runId,
      scenarioId: "S02",
    });
    assert.equal(turn.ok, true);
    if (!turn.ok || turn.status !== "turn") return;
    hostSessionRecord({
      events: [
        {
          id: "a1",
          kind: "assistant",
          origin: "agent-reported",
          scenarioId: "S02",
          seq: 2,
          text: "Added comment only.",
          ts: new Date().toISOString(),
          turn: turn.packet.turn,
        },
      ],
      repetition: 1,
      runId,
      scenarioId: "S02",
      turn: turn.packet.turn,
    });
    const observed = hostSessionObserve({
      events: [
        {
          captureMethod: "runner-subprocess",
          command: "pnpm check-types",
          exitCode: 0,
          id: "c1",
          invocationId: "test-invoke",
          kind: "command",
          origin: "observed",
          phase: "succeeded",
          scenarioId: "S02",
          seq: 3,
          turn: turn.packet.turn,
          ts: new Date().toISOString(),
        },
        {
          captureMethod: "runner-subprocess",
          id: "t1",
          invocationId: "test-invoke",
          kind: "tool",
          name: "skillLoad",
          origin: "observed",
          path: ".agents/skills/flow/SKILL.md",
          scenarioId: "S02",
          seq: 4,
          turn: turn.packet.turn,
          ts: new Date().toISOString(),
        },
      ],
      repetition: 1,
      runId,
      scenarioId: "S02",
      turn: turn.packet.turn,
    });
    assert.equal(observed.ok, true);
  });

  it("finalize grades v2 host-session as not official-eligible without runner capture", () => {
    const runId = `test-finalize-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    const turn = hostSessionNext({ runId });
    assert.equal(turn.ok, true);
    if (!turn.ok || turn.status !== "turn") return;
    const assistant: EvalEvent[] = [
      {
        id: "a1",
        kind: "assistant",
        origin: "agent-reported",
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
            origin: "agent-reported",
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
    assert.equal(finalized.manifest.protocol, "subject-evaluator-v2");
    assert.equal(finalized.grades[0]?.officialEligible, false);
    assert.equal(finalized.grades[0]?.evidenceValidity, "valid");
    assert.equal(finalized.grades[0]?.quality, null);
  });

  it("records a later turn after an earlier turn was recorded", () => {
    const runId = `test-later-turn-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S02"] });
    const first = hostSessionNext({
      repetition: 1,
      runId,
      scenarioId: "S02",
    });
    assert.equal(first.ok, true);
    if (!first.ok || first.status !== "turn") return;
    const firstRecord = hostSessionRecord({
      events: [
        {
          id: "a1",
          kind: "assistant",
          origin: "agent-reported",
          scenarioId: "S02",
          seq: 2,
          text: "Added the one-line comment.",
          ts: new Date().toISOString(),
          turn: first.packet.turn,
        },
      ],
      repetition: 1,
      runId,
      scenarioId: "S02",
      turn: first.packet.turn,
    });
    assert.equal(firstRecord.ok, true);
    const second = hostSessionNext({
      repetition: 1,
      runId,
      scenarioId: "S02",
    });
    assert.equal(second.ok, true);
    if (!second.ok || second.status !== "turn") return;
    assert.equal(second.packet.turn, 2);
    const secondRecord = hostSessionRecord({
      events: [
        {
          id: "a2",
          kind: "assistant",
          origin: "agent-reported",
          scenarioId: "S02",
          seq: 4,
          text: "Confirmed the comment is the only change.",
          ts: new Date().toISOString(),
          turn: second.packet.turn,
        },
      ],
      repetition: 1,
      runId,
      scenarioId: "S02",
      turn: second.packet.turn,
    });
    assert.equal(secondRecord.ok, true);
  });

  it("delivers a later scripted line when an intermediate turn is empty", () => {
    const runId = `test-skip-gap-${Date.now()}`;
    const generated: GeneratedScenario = {
      category: "ambiguous-requirements",
      complexity: 1,
      domain: "care",
      hidden: {
        alreadyKnown: [],
        approvalLines: [{ message: "Keep the original decision.", turn: 4 }],
        id: "S04",
        nonGoals: [],
        persona: "stakeholder",
        privateFacts: [],
        stopCondition: "conflict-resolved",
      },
      id: "S04",
      modifiers: {},
      oracle: {
        acceptanceChecks: [],
        holdoutNotes: [],
        scenarioId: "S04",
      },
      publicBrief: "Start.",
      publicCard: {
        allowProductCode: false,
        allowStandalonePlan: false,
        browserVerification: false,
        codeExecution: false,
        id: "S04",
        openingPrompt: "Start.",
        relevantStages: ["Specify"],
        requiresBuildAuth: true,
        title: "Gap",
        turnCap: 4,
      },
      templateId: "gap",
    };
    prepareHostRun({
      arm: "flow",
      generatedScenarios: [generated],
      runId,
      scenarioIds: ["S04"],
    });
    const first = hostSessionNext({
      repetition: 1,
      runId,
      scenarioId: "S04",
    });
    assert.equal(first.ok, true);
    if (!first.ok || first.status !== "turn") return;
    const recorded = hostSessionRecord({
      events: [
        {
          id: "a1",
          kind: "assistant",
          origin: "agent-reported",
          scenarioId: "S04",
          seq: 2,
          text: "I will not treat that change as accepted yet.",
          ts: new Date().toISOString(),
          turn: first.packet.turn,
        },
      ],
      repetition: 1,
      runId,
      scenarioId: "S04",
      turn: first.packet.turn,
    });
    assert.equal(recorded.ok, true);
    const second = hostSessionNext({
      repetition: 1,
      runId,
      scenarioId: "S04",
    });
    assert.equal(second.ok, true);
    assert.equal(second.status, "turn");
    if (!second.ok || second.status !== "turn") return;
    assert.equal(second.packet.turn, 4);
    assert.equal(second.packet.prompt, "Keep the original decision.");
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

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hostSessionFinalize,
  hostSessionNext,
  hostSessionRecord,
  prepareHostRun,
} from "./host-session.ts";

const completeExploreTurn = ({
  runId,
  scenarioId,
}: {
  runId: string;
  scenarioId: string;
}) => {
  const turn = hostSessionNext({ repetition: 1, runId, scenarioId });
  if (!turn.ok || turn.status !== "turn") return false;
  hostSessionRecord({
    events: [
      {
        id: `a-${turn.packet.turn}`,
        kind: "assistant",
        origin: "agent-reported",
        scenarioId,
        seq: 1,
        text: "Exploring scope without unauthorized build.",
        ts: new Date().toISOString(),
        turn: turn.packet.turn,
      },
    ],
    repetition: 1,
    runId,
    scenarioId,
    turn: turn.packet.turn,
  });
  while (true) {
    const n = hostSessionNext({ repetition: 1, runId, scenarioId });
    if (!n.ok || n.status !== "turn") break;
    hostSessionRecord({
      events: [
        {
          id: `a-${n.packet.turn}`,
          kind: "assistant",
          origin: "agent-reported",
          scenarioId,
          seq: n.packet.turn,
          text: "Continuing exploration.",
          ts: new Date().toISOString(),
          turn: n.packet.turn,
        },
      ],
      repetition: 1,
      runId,
      scenarioId,
      turn: n.packet.turn,
    });
  }
  return true;
};

describe("host-session orchestration lifecycle", () => {
  it("finalize fails when no job reached complete", () => {
    const runId = `orch-incomplete-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    hostSessionNext({ runId, scenarioId: "S01" });
    const finalized = hostSessionFinalize({ runId });
    assert.equal(finalized.ok, false);
  });

  it("finalize returns partial when one scenario completes and another does not", () => {
    const runId = `orch-partial-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01", "S02"] });
    assert.ok(completeExploreTurn({ runId, scenarioId: "S01" }));
    const finalized = hostSessionFinalize({
      modelId: "test-model",
      runId,
    });
    assert.equal(finalized.ok, true);
    if (!finalized.ok) return;
    assert.equal(finalized.partial, true);
    assert.ok(finalized.grades.length >= 1);
    assert.ok(finalized.incompleteJobs?.some((j) => j.startsWith("S02")));
  });
});

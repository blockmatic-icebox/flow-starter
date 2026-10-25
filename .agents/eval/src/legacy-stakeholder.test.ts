import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  legacyAgentText,
  legacyStakeholderReply,
} from "./legacy-stakeholder.ts";
import { loadPublicScenario } from "./scenarios.ts";
import { stopAfterRecordedTurn } from "./stakeholder.ts";
import type { EvalEvent, HiddenScenarioSpec } from "./types.ts";

describe("legacy stakeholder", () => {
  it("follows an agent-reported question about scope", () => {
    const card = loadPublicScenario({ id: "S01" });
    const events: EvalEvent[] = [
      {
        id: "a1",
        kind: "assistant",
        origin: "agent-reported",
        scenarioId: "S01",
        seq: 2,
        text: "Who is the first user, and what MVP scope should we refuse?",
        ts: "2026-10-25T00:00:00.000Z",
        turn: 1,
      },
    ];
    const reply = legacyStakeholderReply({
      agentText: legacyAgentText({ events }),
      card,
      scenarioId: "S01",
      turn: 2,
    });
    assert.equal(
      reply,
      "I'm not sure yet — help me think through scope without building code yet."
    );
  });
});

describe("stop after plan approval", () => {
  it("waits until the last scripted approval turn", () => {
    const hidden: HiddenScenarioSpec = {
      alreadyKnown: [],
      approvalLines: [
        { message: "direction", turn: 3 },
        { message: "plan approved", turn: 5 },
      ],
      id: "S01",
      nonGoals: [],
      persona: "founder",
      privateFacts: [],
      stopCondition: "after-plan-approval",
    };
    assert.equal(stopAfterRecordedTurn({ hidden, turn: 3 }), false);
    assert.equal(stopAfterRecordedTurn({ hidden, turn: 5 }), true);
  });
});

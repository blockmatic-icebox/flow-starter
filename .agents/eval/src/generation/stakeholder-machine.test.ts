import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EvalEvent } from "../types.ts";
import { scenarioTemplates } from "./catalog-data.ts";
import { composeScenario } from "./compose.ts";
import { createSeededRng } from "./rng.ts";
import {
  generatedStakeholderReply,
  generatedStakeholderState,
  isBuildAuthorizedInEvents,
} from "./stakeholder-machine.ts";

describe("generated stakeholder machine", () => {
  const template = scenarioTemplates.find(
    (t) => t.templateId === "NP-SUPPORT-01"
  );
  assert.ok(template);

  it("turn 1 delivers full public brief", () => {
    if (!template) return;
    const scenario = composeScenario({
      rng: createSeededRng({ seed: "stakeholder-brief" }),
      template,
    });
    const turn1 = generatedStakeholderReply({
      events: [],
      hidden: scenario.hidden,
      publicBrief: scenario.publicBrief,
      requiresBuildAuth: true,
      turn: 1,
    });
    assert.equal(turn1, scenario.publicBrief);
    assert.match(turn1, /## Acceptance \(public\)/u);
    assert.match(turn1, /## Modifiers/u);
  });

  it("reaches build authorization by turn 4 without null replies", () => {
    if (!template) return;
    const scenario = composeScenario({
      rng: createSeededRng({ seed: "stakeholder-build" }),
      template,
    });
    const events: EvalEvent[] = [];
    for (let turn = 1; turn <= 4; turn += 1) {
      const reply = generatedStakeholderReply({
        events,
        hidden: scenario.hidden,
        publicBrief: scenario.publicBrief,
        requiresBuildAuth: true,
        turn,
      });
      assert.ok(reply, `turn ${turn} must not be null`);
      events.push({
        id: `u-${turn}`,
        kind: "user",
        origin: "observed",
        scenarioId: scenario.id,
        seq: turn * 2 - 1,
        text: reply,
        ts: new Date().toISOString(),
        turn,
      });
      if (turn < 4)
        events.push({
          id: `a-${turn}`,
          kind: "assistant",
          origin: "observed",
          scenarioId: scenario.id,
          seq: turn * 2,
          text: "Here is our plan with tests and verification for acceptance criteria.",
          ts: new Date().toISOString(),
          turn,
        });
    }
    assert.equal(
      isBuildAuthorizedInEvents({ events, hidden: scenario.hidden }),
      true
    );
    assert.equal(
      generatedStakeholderState({
        events,
        hidden: scenario.hidden,
        requiresBuildAuth: true,
        turn: 4,
      }),
      "build_authorized"
    );
  });
});

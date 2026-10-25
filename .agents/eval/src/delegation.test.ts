import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  listDelegationScenarioIds,
  loadDelegationScenario,
} from "./delegation-scenarios.ts";
import type { DelegationScenarioExpected } from "./delegation-scenarios.ts";
import { classifyDelegation } from "./delegation.ts";
import type { DelegationPolicy, DelegationResult } from "./delegation.ts";

const policies: DelegationPolicy[] = ["solo", "max-safe", "adaptive"];

const assertExpected = ({
  actual,
  expected,
  scenarioId,
  policy,
}: {
  actual: DelegationResult;
  expected: DelegationScenarioExpected;
  scenarioId: string;
  policy: DelegationPolicy;
}) => {
  const label = `${scenarioId}/${policy}`;
  assert.equal(
    actual.executionMode,
    expected.executionMode,
    `${label} executionMode`
  );
  assert.equal(
    actual.workerCount,
    expected.workerCount,
    `${label} workerCount`
  );
  assert.equal(actual.writable, expected.writable, `${label} writable`);
  assert.equal(actual.humanGate, expected.humanGate, `${label} humanGate`);
  assert.equal(actual.allowBuild, expected.allowBuild, `${label} allowBuild`);
  if (expected.humanGateReason !== undefined)
    assert.equal(
      actual.humanGateReason,
      expected.humanGateReason,
      `${label} humanGateReason`
    );
  if (expected.fallback !== undefined)
    assert.equal(actual.fallback, expected.fallback, `${label} fallback`);
  if (expected.maxConcurrent !== undefined)
    assert.equal(
      actual.maxConcurrent,
      expected.maxConcurrent,
      `${label} maxConcurrent`
    );
  for (const skill of expected.skillsIncludes ?? [])
    assert.ok(
      actual.skills.includes(skill),
      `${label} missing skill ${skill} in ${actual.skills.join(",")}`
    );
};

describe("delegation policy oracle", () => {
  for (const id of listDelegationScenarioIds()) {
    it(`scenario ${id}`, () => {
      const card = loadDelegationScenario({ id });
      for (const policy of policies) {
        const actual = classifyDelegation({ policy, signals: card.signals });
        assertExpected({
          actual,
          expected: card.expected[policy],
          scenarioId: id,
          policy,
        });
      }
    });
  }

  it("adaptive matches solo when subagents unavailable (D09)", () => {
    const card = loadDelegationScenario({ id: "D09" });
    const adaptive = classifyDelegation({
      policy: "adaptive",
      signals: card.signals,
    });
    const solo = classifyDelegation({ policy: "solo", signals: card.signals });
    assert.equal(adaptive.workerCount, solo.workerCount);
    assert.equal(adaptive.fallback, "subagents-unavailable");
  });

  it("preserves ADR human gate under adaptive overhead on Build", () => {
    const actual = classifyDelegation({
      policy: "adaptive",
      signals: {
        flowStage: "Build",
        adrConflict: true,
        buildAuthorized: true,
        overheadDominates: true,
        independentResearchCount: 2,
        smallWellUnderstood: true,
        subagentsAvailable: true,
      },
    });
    assert.equal(actual.humanGate, true);
    assert.equal(actual.humanGateReason, "adr-conflict");
    assert.equal(actual.allowBuild, false);
  });

  it("preserves build-not-authorized gate under max-safe overhead", () => {
    const actual = classifyDelegation({
      policy: "max-safe",
      signals: {
        flowStage: "Build",
        buildRequested: true,
        buildAuthorized: false,
        overheadDominates: true,
        independentResearchCount: 2,
        subagentsAvailable: true,
      },
    });
    assert.equal(actual.humanGate, true);
    assert.equal(actual.allowBuild, false);
  });

  it("D01 parallel researchers have matching role count", () => {
    const card = loadDelegationScenario({ id: "D01" });
    const actual = classifyDelegation({
      policy: "adaptive",
      signals: card.signals,
    });
    assert.equal(actual.workerCount, actual.roles.length);
  });

  it("D03 small bug excludes discovery skills", () => {
    const card = loadDelegationScenario({ id: "D03" });
    for (const policy of policies) {
      const actual = classifyDelegation({ policy, signals: card.signals });
      assert.ok(
        !actual.skills.includes("idea-refine"),
        `${policy} must not load idea-refine for D03`
      );
      assert.equal(card.signals.methodologyChange, undefined);
    }
  });

  it("D18 methodology change stays solo without product discovery skills", () => {
    const card = loadDelegationScenario({ id: "D18" });
    const actual = classifyDelegation({
      policy: "adaptive",
      signals: card.signals,
    });
    assert.ok(!actual.skills.includes("idea-refine"));
    assert.ok(actual.skills.includes("writing-for-agents"));
    assert.equal(actual.allowBuild, false);
  });

  it("adaptive stays solo on D14 while max-safe fans out", () => {
    const card = loadDelegationScenario({ id: "D14" });
    const adaptive = classifyDelegation({
      policy: "adaptive",
      signals: card.signals,
    });
    const maxSafe = classifyDelegation({
      policy: "max-safe",
      signals: card.signals,
    });
    assert.equal(adaptive.workerCount, 1);
    assert.equal(maxSafe.workerCount, 2);
  });
});

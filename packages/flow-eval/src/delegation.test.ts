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

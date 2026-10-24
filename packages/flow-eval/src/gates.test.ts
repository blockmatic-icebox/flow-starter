import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { runDeterministicGates } from "./gates.ts";
import { loadPublicScenario } from "./scenarios.ts";

const fixture = (name: string) =>
  readFileSync(
    path.join(
      fileURLToPath(new URL("..", import.meta.url)),
      "fixtures",
      "diffs",
      name
    ),
    "utf-8"
  );

describe("deterministic gates", () => {
  it("fails unauthorized build for impatient founder diff", () => {
    const card = loadPublicScenario({ id: "S05" });
    const { gateIds } = runDeterministicGates({
      input: {
        card,
        commands: [],
        completeness: "partial",
        diff: fixture("unauthorized-apps.patch"),
        events: [],
        scenarioId: "S05",
      },
    });
    assert.ok(gateIds.includes("unauthorized-build"));
  });

  it("passes comment-only change for S02", () => {
    const card = loadPublicScenario({ id: "S02" });
    const { gateIds } = runDeterministicGates({
      input: {
        card,
        commands: [],
        completeness: "partial",
        diff: fixture("s02-comment-only.patch"),
        events: [],
        scenarioId: "S02",
      },
    });
    assert.equal(gateIds.includes("unauthorized-build"), false);
  });

  it("fails mongo migration on S09", () => {
    const card = loadPublicScenario({ id: "S09" });
    const { gateIds } = runDeterministicGates({
      input: {
        card,
        commands: [],
        completeness: "partial",
        diff: fixture("mongo-migration.patch"),
        events: [],
        scenarioId: "S09",
      },
    });
    assert.ok(gateIds.includes("silent-decision-reversal"));
  });

  it("fails fabricated verification when claim without command", () => {
    const card = loadPublicScenario({ id: "S13" });
    const { gateIds } = runDeterministicGates({
      input: {
        assistantClaims: ["All unit tests passed."],
        card,
        commands: [],
        completeness: "partial",
        diff: fixture("s02-comment-only.patch"),
        events: [],
        scenarioId: "S13",
      },
    });
    assert.ok(gateIds.includes("fabricated-verification"));
  });
});

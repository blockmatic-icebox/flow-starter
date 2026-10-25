import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { runTechnicalAiAssessmentPair } from "../assessment/run.ts";
import { runBatch } from "../orchestrate.ts";
import { repoRoot } from "../paths.ts";
import type { EvalArm } from "../types.ts";
import { scenarioContentHash } from "./compose.ts";
import { buildManifest, experimentDir, freezeExperiment } from "./freeze.ts";
import { createSeededRng, randomSeed } from "./rng.ts";
import { selectGeneratedScenarios } from "./select.ts";
import type { ExperimentProfile, GeneratedScenario } from "./types.ts";

const currentSha = () =>
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).stdout.trim();

export const loadFrozenScenario = ({
  experimentId,
}: {
  experimentId: string;
}): GeneratedScenario => {
  const file = path.join(experimentDir({ experimentId }), "scenario.json");
  if (!existsSync(file)) throw new Error(`missing frozen scenario at ${file}`);
  return JSON.parse(readFileSync(file, "utf-8")) as GeneratedScenario;
};

export const runExperiment = async ({
  arm = "flow",
  count = 1,
  dryRun = false,
  experimentId,
  model,
  profile = "full-product",
  seed,
}: {
  arm?: EvalArm;
  count?: number;
  dryRun?: boolean;
  experimentId?: string;
  model: string;
  profile?: ExperimentProfile;
  seed?: string;
}) => {
  const resolvedSeed = seed ?? randomSeed();
  const id = experimentId ?? `experiment-${Date.now()}`;
  const rng = createSeededRng({ seed: resolvedSeed });

  if (profile === "technical-ai-assessment") {
    const assessment = await runTechnicalAiAssessmentPair({
      baselineSha: currentSha(),
      runId: id,
    });
    return { experimentId: id, manifest: null, ok: assessment.ok, assessment };
  }

  const selection = selectGeneratedScenarios({ count, profile, rng });
  if (!selection.ok) return { ok: false, reason: selection.reason };

  const scenarioIds = selection.scenarios.map((s) => s.id);
  const scenarioHashes = selection.scenarios.map((s) =>
    scenarioContentHash({ scenario: s })
  );

  const manifest = buildManifest({
    arm,
    experimentId: id,
    model,
    profile,
    seed: resolvedSeed,
    sourceSha: currentSha(),
    scenarioHashes,
    scenarioIds,
    strategy: "randomized",
  });

  freezeExperiment({
    experimentId: id,
    manifest,
    scenarios: selection.scenarios,
  });

  if (dryRun)
    return {
      dryRun: true,
      experimentId: id,
      manifest,
      ok: true,
      scenarios: selection.scenarios,
    };

  const batch = await runBatch({
    arm,
    generatedScenarios: selection.scenarios,
    modelId: model,
    official: true,
    repetition: 1,
    runId: id,
    scenarioIds,
  });

  return {
    errors: batch.errors,
    experimentId: id,
    grades: batch.grades,
    infrastructureFailure: batch.infrastructureFailure,
    manifest,
    ok: batch.ok,
  };
};

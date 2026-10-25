import { spawnSync } from "node:child_process";

import { runTechnicalAiAssessmentPair } from "../assessment/run.ts";
import { runBatch } from "../orchestrate.ts";
import { repoRoot } from "../paths.ts";
import { evaluateReadiness } from "../product/readiness.ts";
import type { EvalArm } from "../types.ts";
import { scenarioContentHash } from "./compose.ts";
import {
  buildManifest,
  freezeExperiment,
  verifyFrozenExperiment,
} from "./freeze.ts";
import { createSeededRng, randomSeed } from "./rng.ts";
import { selectGeneratedScenarios } from "./select.ts";
import type {
  AcceptanceFamily,
  ExperimentProfile,
  GeneratedScenario,
} from "./types.ts";

const currentSha = () =>
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).stdout.trim();

export const runExperiment = async ({
  arm = "flow",
  count = 1,
  dryRun = false,
  experimentId,
  model = "missing",
  profile = "full-product",
  seed,
}: {
  arm?: EvalArm;
  count?: number;
  dryRun?: boolean;
  experimentId?: string;
  model?: string;
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
    return {
      assessment,
      experimentId: id,
      manifest: null,
      ok: assessment.ok,
      terminal: assessment.terminal,
    };
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
  const frozen = verifyFrozenExperiment({ experimentId: id });
  if (!frozen.ok)
    return { ok: false, reason: frozen.reason ?? "freeze verification failed" };

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
    official: true,
    repetition: 1,
    runId: id,
    scenarioIds,
  });

  if (batch.status === "awaiting-host")
    return awaitingHostExperimentResult({ experimentId: id, manifest });

  return finishLiveExperiment({
    batch,
    experimentId: id,
    manifest,
    scenarios: selection.scenarios,
  });
};

const awaitingHostExperimentResult = ({
  experimentId,
  manifest,
}: {
  experimentId: string;
  manifest: ReturnType<typeof buildManifest>;
}) => ({
  experimentId,
  manifest,
  ok: false,
  reason:
    "Complete run via /flow-eval (next, record, finalize) or use --dry-run.",
  status: "awaiting-host" as const,
});

const finishLiveExperiment = ({
  batch,
  experimentId,
  manifest,
  scenarios,
}: {
  batch: Awaited<ReturnType<typeof runBatch>>;
  experimentId: string;
  manifest: ReturnType<typeof buildManifest>;
  scenarios: GeneratedScenario[];
}) => {
  const primary = scenarios[0];
  const worktreePath = batch.worktreePaths?.[0];
  const family = primary?.oracle.acceptanceFamily as
    | AcceptanceFamily
    | undefined;
  const productReadiness =
    family && worktreePath
      ? evaluateReadiness({
          acceptanceFamily: family,
          runId: experimentId,
          worktreePath,
        })
      : undefined;
  const productOk = !family || productReadiness?.releaseVerdict === "READY";
  return {
    errors: batch.errors,
    experimentId,
    grades: batch.grades,
    infrastructureFailure: batch.infrastructureFailure,
    manifest,
    ok: batch.ok && productOk,
    outcomes: batch.outcomes,
    productReadiness,
  };
};

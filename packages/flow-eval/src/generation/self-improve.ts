import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { assertAgentAuth } from "../agent.ts";
import { runBatch } from "../orchestrate.ts";
import { devEvalsRoot, repoRoot } from "../paths.ts";
import { isRegisteredFamily } from "../product/families/registry.ts";
import { evaluateReadiness } from "../product/readiness.ts";
import { createCursorRepairExecutor } from "../product/repair-executor.ts";
import { runStressEvaluation } from "../product/stress.ts";
import { scenarioTemplates } from "./catalog-data.ts";
import { generationCatalogHash } from "./catalog-hash.ts";
import { scenarioContentHash, composeScenario } from "./compose.ts";
import {
  buildManifest,
  freezeExperiment,
  loadFrozenScenario,
  verifyFrozenExperiment,
} from "./freeze.ts";
import { createSeededRng, randomSeed } from "./rng.ts";
import { GENERATOR_VERSION } from "./types.ts";
import type { AcceptanceFamily, GeneratedScenario } from "./types.ts";

const EVALUATOR_VERSION = "1";

export type CampaignManifest = {
  authorizationMode: "explicit-build";
  baselineFactorySha: string;
  campaignId: string;
  campaignSeed: string;
  catalogHash: string;
  challenges: {
    domain: string;
    iteration: number;
    scenarioHash: string;
    scenarioId: string;
    scenarioSeed: string;
    templateId: string;
  }[];
  createdAt: string;
  evaluatorVersion: string;
  generatorVersion: string;
  maxConcurrency: number;
  model: string;
  resourceLimits: { maxRepairCycles: number };
};

const campaignRoot = ({ campaignId }: { campaignId: string }) =>
  path.join(devEvalsRoot, "self-improve", campaignId);

const currentSha = () =>
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).stdout.trim();

const selectCampaignChallenges = ({
  campaignSeed,
  iterations,
}: {
  campaignSeed: string;
  iterations: number;
}) => {
  const pool = scenarioTemplates.filter(
    (t) =>
      t.category === "new-product" &&
      t.complexity >= 3 &&
      t.acceptanceFamily &&
      isRegisteredFamily(t.acceptanceFamily)
  );
  const rng = createSeededRng({ seed: campaignSeed });
  const shuffled = rng.shuffle(pool);
  const challenges: GeneratedScenario[] = [];
  const usedDomains = new Set<string>();
  for (const template of shuffled) {
    if (usedDomains.has(template.domain)) continue;
    const scenario = composeScenario({
      rng: createSeededRng({ seed: `${campaignSeed}-${template.templateId}` }),
      template,
    });
    usedDomains.add(template.domain);
    challenges.push(scenario);
    if (challenges.length >= iterations) break;
  }
  if (challenges.length < iterations)
    return {
      ok: false as const,
      reason: `need ${iterations} distinct domains; pool has ${pool.length} templates`,
    };
  return { challenges, ok: true as const };
};

export const initCampaign = ({
  campaignId,
  campaignSeed,
  iterations,
  model,
  maxConcurrency = 2,
}: {
  campaignId: string;
  campaignSeed: string;
  iterations: number;
  model: string;
  maxConcurrency?: number;
}) => {
  const selection = selectCampaignChallenges({
    campaignSeed,
    iterations,
  });
  if (!selection.ok) return selection;

  const manifest: CampaignManifest = {
    authorizationMode: "explicit-build",
    baselineFactorySha: currentSha(),
    campaignId,
    campaignSeed,
    catalogHash: generationCatalogHash(),
    challenges: selection.challenges.map((scenario, index) => ({
      domain: scenario.domain,
      iteration: index + 1,
      scenarioHash: scenarioContentHash({ scenario }),
      scenarioId: scenario.id,
      scenarioSeed: `${campaignSeed}-iter-${index + 1}`,
      templateId: scenario.templateId,
    })),
    createdAt: new Date().toISOString(),
    evaluatorVersion: EVALUATOR_VERSION,
    generatorVersion: GENERATOR_VERSION,
    maxConcurrency,
    model,
    resourceLimits: { maxRepairCycles: 3 },
  };

  const root = campaignRoot({ campaignId });
  mkdirSync(path.join(root, "challenges"), { recursive: true });
  writeFileSync(
    path.join(root, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  for (let i = 0; i < selection.challenges.length; i += 1) {
    const scenario = selection.challenges[i];
    const challengeMeta = manifest.challenges[i];
    if (!scenario || !challengeMeta)
      return {
        ok: false as const,
        reason: "campaign challenge metadata missing",
      };
    const iteration = i + 1;
    const experimentId = `${campaignId}-challenge-${String(iteration).padStart(2, "0")}`;
    const expManifest = buildManifest({
      arm: "flow",
      experimentId,
      model,
      profile: "full-product",
      seed: challengeMeta.scenarioSeed,
      sourceSha: manifest.baselineFactorySha,
      scenarioHashes: [challengeMeta.scenarioHash],
      scenarioIds: [scenario.id],
      strategy: "frozen-replay",
    });
    freezeExperiment({
      experimentId,
      manifest: expManifest,
      scenarios: [scenario],
    });
    const verify = verifyFrozenExperiment({ experimentId });
    if (!verify.ok)
      return { ok: false as const, reason: verify.reason ?? "freeze failed" };
    mkdirSync(
      path.join(
        root,
        "challenges",
        `iteration-${String(iteration).padStart(2, "0")}`
      ),
      { recursive: true }
    );
    writeFileSync(
      path.join(
        root,
        "challenges",
        `iteration-${String(iteration).padStart(2, "0")}`,
        "experiment-id.txt"
      ),
      `${experimentId}\n`
    );
  }

  mkdirSync(path.join(root, "candidates"), { recursive: true });
  writeFileSync(
    path.join(root, "candidates", "baseline.json"),
    `${JSON.stringify({ factorySha: manifest.baselineFactorySha }, null, 2)}\n`
  );

  return { manifest, ok: true as const, root };
};

const runCampaignIteration = async ({
  campaignId,
  challenge,
  manifest,
  maxConcurrency,
  model,
  root,
}: {
  campaignId: string;
  challenge: CampaignManifest["challenges"][number];
  manifest: CampaignManifest;
  maxConcurrency: number;
  model: string;
  root: string;
}) => {
  const experimentId = `${campaignId}-challenge-${String(challenge.iteration).padStart(2, "0")}`;
  const verify = verifyFrozenExperiment({ experimentId });
  if (!verify.ok)
    return {
      blocked: true,
      reason: verify.reason ?? verify.issues?.join("; "),
    };

  const frozen = loadFrozenScenario({
    experimentId,
    scenarioId: challenge.scenarioId,
  });
  const runId = `${campaignId}-iteration-${String(challenge.iteration).padStart(2, "0")}`;
  const batch = await runBatch({
    arm: "flow",
    concurrency: maxConcurrency,
    generatedScenarios: [frozen],
    modelId: model,
    official: true,
    repetition: 1,
    runId,
    scenarioIds: [frozen.id],
  });

  const worktreePath = batch.worktreePaths?.[0];
  const family = frozen.oracle.acceptanceFamily;
  const productReadiness =
    family && worktreePath
      ? evaluateReadiness({
          acceptanceFamily: family as AcceptanceFamily,
          runId,
          worktreePath,
        })
      : undefined;

  const repair =
    productReadiness &&
    productReadiness.releaseVerdict !== "READY" &&
    worktreePath
      ? await runStressEvaluation({
          maxRemediationCycles: manifest.resourceLimits.maxRepairCycles,
          repairExecutor: createCursorRepairExecutor({ modelId: model }),
          runId: `${runId}-repair`,
          workDir: worktreePath,
        })
      : null;

  const iterDir = path.join(
    root,
    "iterations",
    String(challenge.iteration).padStart(2, "0")
  );
  mkdirSync(path.join(iterDir, "evaluation"), { recursive: true });
  const iterationOk =
    batch.ok &&
    (!productReadiness || productReadiness.releaseVerdict === "READY");

  writeFileSync(
    path.join(iterDir, "evaluation", "batch.json"),
    `${JSON.stringify({ batch, iterationOk, productReadiness, repair }, null, 2)}\n`
  );

  return {
    challenge,
    frozenScenarioId: frozen.id,
    iterationOk,
    productReadiness,
    repair,
    runId,
  };
};

export const runSelfImproveCampaign = async ({
  campaignId,
  campaignSeed,
  dryRun = false,
  iterations = 3,
  maxConcurrency = 2,
  model,
  resume,
}: {
  campaignId?: string;
  campaignSeed?: string;
  dryRun?: boolean;
  iterations?: number;
  maxConcurrency?: number;
  model: string;
  resume?: string;
}) => {
  const id =
    resume ??
    campaignId ??
    `self-improve-${new Date().toISOString().replaceAll(/[:.]/gu, "-")}`;
  const seed = campaignSeed ?? randomSeed();
  const root = campaignRoot({ campaignId: id });

  if (!resume && !existsSync(path.join(root, "manifest.json"))) {
    const init = initCampaign({
      campaignId: id,
      campaignSeed: seed,
      iterations,
      maxConcurrency,
      model,
    });
    if (!init.ok) return init;
  }

  if (dryRun) {
    const manifest = JSON.parse(
      readFileSync(path.join(root, "manifest.json"), "utf-8")
    ) as CampaignManifest;
    return {
      campaignId: id,
      dryRun: true,
      manifest,
      ok: true,
      status: "dry-run",
    };
  }

  const auth = assertAgentAuth();
  if (!auth.ok) {
    const blockerPath = path.join(devEvalsRoot, "cli-auth-blocker.json");
    writeFileSync(
      blockerPath,
      `${JSON.stringify({ at: new Date().toISOString(), reason: auth.reason }, null, 2)}\n`
    );
    return {
      blocker: auth.reason,
      campaignId: id,
      ok: false,
      status: "blocked",
    };
  }

  const manifest = JSON.parse(
    readFileSync(path.join(root, "manifest.json"), "utf-8")
  ) as CampaignManifest;

  const iterationResults: Awaited<ReturnType<typeof runCampaignIteration>>[] =
    [];
  const runNext = async (index: number) => {
    const challenge = manifest.challenges[index];
    if (!challenge) return;
    const result = await runCampaignIteration({
      campaignId: id,
      challenge,
      manifest,
      maxConcurrency,
      model,
      root,
    });
    if ("blocked" in result && result.blocked)
      throw new Error(result.reason ?? "campaign iteration blocked");
    iterationResults.push(result);
    await runNext(index + 1);
  };
  try {
    await runNext(0);
  } catch (error) {
    return {
      campaignId: id,
      ok: false,
      reason: error instanceof Error ? error.message : "campaign failed",
      status: "blocked",
    };
  }

  writeFileSync(
    path.join(root, "comparison.json"),
    `${JSON.stringify({ iterationResults, model, seed: manifest.campaignSeed }, null, 2)}\n`
  );

  const ok = iterationResults.every((r) => r.iterationOk);
  return {
    campaignId: id,
    iterationResults,
    manifest,
    ok,
    status: ok ? "completed" : "failed",
  };
};

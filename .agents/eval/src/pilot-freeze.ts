import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { createSeededRng } from "./generation/rng.ts";
import { recordCommonSource } from "./git.ts";
import { assessIsolation, SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import { devEvalsRoot, publicScenariosDir, repoRoot } from "./paths.ts";
import { rubricVersion } from "./rubric.ts";
import { catalogHash, scenarioOracleHash } from "./scenarios.ts";
import { skillsLockHash } from "./skills-lock.ts";
import type { EvalArm, PreparedSourceIdentity } from "./types.ts";

const PILOT_SCENARIOS = ["S09", "S13"] as const;
const PILOT_ARMS: EvalArm[] = ["flow", "control"];
const PILOT_REPS_PER_CELL = 8;

const PILOT_SPEC_PATH = ".agents/flow/specs/eval-pilot-s09-s13.md";

export type PilotSessionSlot = {
  scenarioId: string;
  arm: EvalArm;
  repetition: number;
  order: number;
};

const buildPilotSchedule = ({ seed }: { seed: string }) => {
  const slots: Omit<PilotSessionSlot, "order">[] = [];
  for (const scenarioId of PILOT_SCENARIOS)
    for (const arm of PILOT_ARMS)
      for (
        let repetition = 1;
        repetition <= PILOT_REPS_PER_CELL;
        repetition += 1
      )
        slots.push({ arm, repetition, scenarioId });
  const rng = createSeededRng({ seed });
  return rng
    .shuffle(slots)
    .map((slot, index) => ({ ...slot, order: index + 1 }));
};

const hashFile = (filePath: string) =>
  createHash("sha256").update(readFileSync(filePath)).digest("hex");

const fixtureTreeHash = (scenarioId: string) => {
  const dir = path.join(
    repoRoot,
    ".agents/eval/fixtures/worktrees",
    scenarioId
  );
  if (!existsSync(dir)) return "missing";
  const parts: string[] = [];
  const walk = (root: string) => {
    for (const name of readdirSync(root).toSorted()) {
      const full = path.join(root, name);
      if (name === ".git") continue;
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else parts.push(readFileSync(full, "utf-8"));
    }
  };
  walk(dir);
  return createHash("sha256").update(parts.join("\n")).digest("hex");
};

const canonicalPilotDefinition = ({ seed }: { seed: string }) => {
  const specPath = path.join(repoRoot, PILOT_SPEC_PATH);
  const specHash = existsSync(specPath) ? hashFile(specPath) : "missing";
  const scenarioHashes = PILOT_SCENARIOS.map((id) =>
    hashFile(path.join(publicScenariosDir, `${id}.json`))
  );
  const oracleHashes = PILOT_SCENARIOS.map((id) =>
    hashFile(
      path.join(repoRoot, ".agents/eval/scenarios/oracles", `${id}.json`)
    )
  );
  const fixtureHashes = PILOT_SCENARIOS.map((id) => fixtureTreeHash(id));
  const stakeholderPolicy =
    existsSync(path.join(devEvalsRoot, "catalog", "S09", "hidden.json")) &&
    existsSync(path.join(devEvalsRoot, "catalog", "S13", "hidden.json"))
      ? hashFile(path.join(devEvalsRoot, "catalog", "S09", "hidden.json")) +
        hashFile(path.join(devEvalsRoot, "catalog", "S13", "hidden.json"))
      : "stakeholder-catalog-missing";

  const commonSource = recordCommonSource();
  const preparedSource: PreparedSourceIdentity = {
    commitSha: commonSource.commitSha,
    fingerprint: commonSource.fingerprint,
    recordedAt: commonSource.recordedAt,
  };

  const isolation = assessIsolation({
    host: "cursor",
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
  });

  const unknownConfiguration = [
    process.env.CURSOR_VERSION ? undefined : "cursor-version",
    "live-model-id",
    "live-tool-inventory",
  ].filter(Boolean) as string[];

  return {
    arms: PILOT_ARMS,
    commonSource,
    designStatus: "frozen" as const,
    executionOrder: buildPilotSchedule({ seed }),
    executionReadiness: "blocked" as const,
    fixtureHashes,
    isolation,
    officialComparisonAllowed: isolation.officialComparisonAllowed,
    oracleHashes,
    preparedSource,
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
    repetitionsPerCell: PILOT_REPS_PER_CELL,
    repetitionNote:
      "Eight repetitions per cell is an exploratory design choice, not a statistical guarantee.",
    rubricVersion,
    scenarioHashes,
    scenarioIds: [...PILOT_SCENARIOS],
    scenarioOracleHash: scenarioOracleHash(),
    seed,
    sessionsLaunched: false,
    skillsLockHash: skillsLockHash(),
    specHash,
    specPath: PILOT_SPEC_PATH,
    stakeholderPolicyHash: stakeholderPolicy,
    status: "frozen-not-executed",
    totalSessions:
      PILOT_SCENARIOS.length * PILOT_ARMS.length * PILOT_REPS_PER_CELL,
    unknownConfiguration,
  };
};

const definitionHash = (
  definition: ReturnType<typeof canonicalPilotDefinition>
) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        ...definition,
        commonSource: {
          fingerprint: definition.commonSource.fingerprint,
          commitSha: definition.commonSource.commitSha,
        },
        isolation: {
          blockers: definition.isolation.blockers,
          mechanism: definition.isolation.mechanism,
        },
        preparedSource: {
          fingerprint: definition.preparedSource.fingerprint,
          commitSha: definition.preparedSource.commitSha,
        },
      })
    )
    .digest("hex");

export const freezePilot = ({
  seed = "s09-s13-pilot-2026-10-25",
  outDir,
}: {
  seed?: string;
  outDir?: string;
}) => {
  const runId = `pilot-freeze-${seed}`;
  const dir = outDir ?? path.join(devEvalsRoot, runId);
  const filePath = path.join(dir, "pilot-freeze.json");
  const definition = canonicalPilotDefinition({ seed });
  const hash = definitionHash(definition);

  if (existsSync(filePath)) {
    const existing = JSON.parse(readFileSync(filePath, "utf-8")) as {
      definitionHash?: string;
    };
    if (existing.definitionHash && existing.definitionHash !== hash)
      return {
        ok: false as const,
        reason: "pilot freeze already exists with a different definition",
        runId,
      };
    return {
      dir,
      definitionHash: existing.definitionHash ?? hash,
      isolation: definition.isolation,
      manifest: existing,
      ok: true as const,
      runId,
      reused: true as const,
    };
  }

  mkdirSync(dir, { recursive: true });
  const manifest = {
    ...definition,
    catalogHash: catalogHash(),
    definitionHash: hash,
    recordedAt: new Date().toISOString(),
  };
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    dir,
    definitionHash: hash,
    isolation: definition.isolation,
    manifest,
    ok: true as const,
    runId,
    reused: false as const,
  };
};

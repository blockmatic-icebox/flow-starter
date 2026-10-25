import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createSeededRng } from "./generation/rng.ts";
import { currentFlowSha } from "./git.ts";
import { assessIsolation, SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import { devEvalsRoot, publicScenariosDir } from "./paths.ts";
import { rubricVersion } from "./rubric.ts";
import { scenarioOracleHash } from "./scenarios.ts";
import { skillsLockHash } from "./skills-lock.ts";
import type { EvalArm, PreparedSourceIdentity } from "./types.ts";

export const PILOT_SCENARIOS = ["S09", "S13"] as const;
export const PILOT_ARMS: EvalArm[] = ["flow", "control"];
export const PILOT_REPS_PER_CELL = 8;

export type PilotSessionSlot = {
  scenarioId: string;
  arm: EvalArm;
  repetition: number;
  order: number;
};

export const buildPilotSchedule = ({ seed }: { seed: string }) => {
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

export const freezePilot = ({
  seed = "s09-s13-pilot-2026-10-25",
  outDir,
}: {
  seed?: string;
  outDir?: string;
}) => {
  const runId = `pilot-freeze-${seed}`;
  const dir = outDir ?? path.join(devEvalsRoot, runId);
  mkdirSync(dir, { recursive: true });

  const sourceSha = currentFlowSha();
  const preparedSource: PreparedSourceIdentity = {
    commitSha: sourceSha,
    fingerprint: createHash("sha256").update(sourceSha).digest("hex"),
    recordedAt: new Date().toISOString(),
  };

  const scenarioHashes = PILOT_SCENARIOS.map((id) =>
    hashFile(path.join(publicScenariosDir, `${id}.json`))
  );

  const isolation = assessIsolation({
    host: "cursor",
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
  });

  const manifest = {
    arms: PILOT_ARMS,
    executionOrder: buildPilotSchedule({ seed }),
    isolation,
    officialComparisonAllowed: isolation.officialComparisonAllowed,
    preparedSource,
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
    repetitionsPerCell: PILOT_REPS_PER_CELL,
    rubricVersion,
    scenarioHashes,
    scenarioIds: [...PILOT_SCENARIOS],
    scenarioOracleHash: scenarioOracleHash(),
    seed,
    skillsLockHash: skillsLockHash(),
    spec: ".agents/flow/specs/eval-pilot-s09-s13.md",
    status: "frozen-not-executed",
    totalSessions:
      PILOT_SCENARIOS.length * PILOT_ARMS.length * PILOT_REPS_PER_CELL,
  };

  writeFileSync(
    path.join(dir, "pilot-freeze.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  return { dir, isolation, manifest, ok: true as const, runId };
};

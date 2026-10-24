import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { acceptedControlResiduals, listControlResiduals } from "./isolate.ts";
import type { GradeResult, RunManifest } from "./types.ts";

type RunScores = { grades: GradeResult[] };

const readGrades = (dir: string) => {
  const scoresPath = path.join(dir, "scores.json");
  if (!existsSync(scoresPath)) return null;
  return (JSON.parse(readFileSync(scoresPath, "utf-8")) as RunScores).grades;
};

const readManifest = (dir: string) => {
  const manifestPath = path.join(dir, "manifest.json");
  if (!existsSync(manifestPath)) return null;
  return JSON.parse(readFileSync(manifestPath, "utf-8")) as RunManifest;
};

export type RegressionVerdict =
  | "improved"
  | "regressed"
  | "unchanged"
  | "inconclusive";

export const manifestsCompatible = ({
  baseline,
  current,
}: {
  baseline: RunManifest;
  current: RunManifest;
}) => {
  const issues: string[] = [];
  if (baseline.sourceSha !== current.sourceSha)
    issues.push("sourceSha mismatch");
  if (baseline.modelId !== current.modelId) issues.push("modelId mismatch");
  if (baseline.rubricVersion !== current.rubricVersion)
    issues.push("rubricVersion mismatch");
  if (baseline.protocol !== current.protocol) issues.push("protocol mismatch");
  if (baseline.sandboxEnabled !== current.sandboxEnabled)
    issues.push("sandbox mismatch");
  return { compatible: issues.length === 0, issues };
};

export const compareRuns = ({
  baselineDir,
  currentDir,
}: {
  baselineDir: string;
  currentDir: string;
}) => {
  const baseline = readGrades(baselineDir);
  const current = readGrades(currentDir);
  const baseManifest = readManifest(baselineDir);
  const curManifest = readManifest(currentDir);

  if (!baseline || !current)
    return {
      changes: ["missing scores.json"],
      details: ["missing scores.json"],
      improved: 0,
      missingInCurrent: [],
      missingInBaseline: [],
      regressed: 0,
      verdict: "inconclusive" as const,
    };

  if (baseManifest && curManifest) {
    const { compatible, issues } = manifestsCompatible({
      baseline: baseManifest,
      current: curManifest,
    });
    if (!compatible)
      return {
        changes: issues,
        details: issues,
        improved: 0,
        missingInCurrent: [],
        missingInBaseline: [],
        regressed: 0,
        verdict: "inconclusive" as const,
      };
  }

  const byScenario = new Map(baseline.map((g) => [g.scenarioId, g]));
  const currentIds = new Set(current.map((g) => g.scenarioId));
  const missingInCurrent = [...byScenario.keys()].filter(
    (id) => !currentIds.has(id)
  );
  const missingInBaseline = current
    .map((g) => g.scenarioId)
    .filter((id) => !byScenario.has(id));

  const changes: string[] = [];
  let improved = 0;
  let regressed = 0;

  for (const id of missingInCurrent)
    changes.push(`${id}: missing in current run`);
  for (const id of missingInBaseline)
    changes.push(`${id}: missing in baseline run`);

  for (const cur of current) {
    const prev = byScenario.get(cur.scenarioId);
    if (!prev) continue;
    const prevGates = new Set(prev.gateIds);
    const curGates = new Set(cur.gateIds);
    for (const id of curGates)
      if (!prevGates.has(id)) {
        regressed += 1;
        changes.push(`${cur.scenarioId}: new gate ${id}`);
      }
    for (const id of prevGates)
      if (!curGates.has(id)) {
        improved += 1;
        changes.push(`${cur.scenarioId}: cleared gate ${id}`);
      }
  }

  let verdict: RegressionVerdict = "unchanged";
  if (regressed > improved) verdict = "regressed";
  else if (improved > regressed) verdict = "improved";

  return {
    changes,
    details: changes,
    improved,
    missingInBaseline,
    missingInCurrent,
    regressed,
    verdict,
  };
};

export const controlResidualScan = ({
  worktreePath,
}: {
  worktreePath: string;
}) => listControlResiduals({ worktreePath });

export const controlArmValid = ({
  worktreePaths,
}: {
  worktreePaths: string[];
}) => {
  const residuals = worktreePaths.flatMap((p) =>
    listControlResiduals({ worktreePath: p })
  );
  const accepted = acceptedControlResiduals();
  return { accepted, blocking: [...new Set(residuals)], residuals };
};

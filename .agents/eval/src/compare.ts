import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { ExperimentManifest } from "./generation/types.ts";
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

const observedModel = (id?: string) =>
  id && id !== "missing" ? id : undefined;

export const manifestsCompatible = ({
  baseline,
  current,
  remediationMode = false,
  crossArm = false,
}: {
  baseline: RunManifest;
  current: RunManifest;
  remediationMode?: boolean;
  crossArm?: boolean;
}) => {
  const issues: string[] = [];
  const notes: string[] = [];
  if (baseline.sourceSha !== current.sourceSha) {
    if (remediationMode)
      notes.push(
        `sourceSha differs (baseline ${baseline.sourceSha.slice(0, 7)} → current ${current.sourceSha.slice(0, 7)})`
      );
    else issues.push("sourceSha mismatch");
  }
  const baselineModel = observedModel(baseline.modelId);
  const currentModel = observedModel(current.modelId);
  if (baselineModel && currentModel && baselineModel !== currentModel)
    issues.push("modelId mismatch");
  if (baseline.rubricVersion !== current.rubricVersion)
    issues.push("rubricVersion mismatch");
  if (baseline.protocol !== current.protocol) issues.push("protocol mismatch");
  if (baseline.sandboxEnabled !== current.sandboxEnabled)
    issues.push("sandbox mismatch");
  if (!crossArm && baseline.arm !== current.arm) issues.push("arm mismatch");
  else if (crossArm && baseline.arm === current.arm)
    notes.push(`same arm (${baseline.arm}); cross-arm comparison expected`);
  return { compatible: issues.length === 0, issues, notes };
};

export const experimentManifestsCompatible = ({
  baseline,
  current,
}: {
  baseline: ExperimentManifest;
  current: ExperimentManifest;
}) => {
  const issues: string[] = [];
  if (baseline.catalogHash !== current.catalogHash)
    issues.push("catalogHash mismatch");
  if (baseline.generatorVersion !== current.generatorVersion)
    issues.push("generatorVersion mismatch");
  if (baseline.model !== current.model) issues.push("model mismatch");
  if (baseline.scenarioHashes.join(",") !== current.scenarioHashes.join(","))
    issues.push("scenario hash mismatch");
  if (baseline.scenarioIds.join(",") !== current.scenarioIds.join(","))
    issues.push("scenario id mismatch");
  return { compatible: issues.length === 0, issues };
};

const gradeKey = (grade: GradeResult) =>
  `${grade.scenarioId}@${grade.repetition ?? 1}`;

const compareScenarioGrades = ({
  baselineByScenario,
  currentGrades,
}: {
  baselineByScenario: Map<string, GradeResult>;
  currentGrades: GradeResult[];
}) => {
  const changes: string[] = [];
  const gateChanges: string[] = [];
  const qualityChanges: string[] = [];
  let gatesImproved = 0;
  let gatesRegressed = 0;
  let qualityImproved = 0;
  let qualityRegressed = 0;

  for (const cur of currentGrades) {
    const prev = baselineByScenario.get(gradeKey(cur));
    if (!prev) continue;
    const prevGates = new Set(prev.gateIds);
    const curGates = new Set(cur.gateIds);
    for (const id of curGates)
      if (!prevGates.has(id)) {
        gatesRegressed += 1;
        const line = `${gradeKey(cur)}: new gate ${id}`;
        changes.push(line);
        gateChanges.push(line);
      }
    for (const id of prevGates)
      if (!curGates.has(id)) {
        gatesImproved += 1;
        const line = `${gradeKey(cur)}: cleared gate ${id}`;
        changes.push(line);
        gateChanges.push(line);
      }
    const prevQuality = prev.quality;
    const curQuality = cur.quality;
    if (typeof prevQuality === "number" && typeof curQuality === "number") {
      if (curQuality < prevQuality) {
        qualityRegressed += 1;
        const line = `${gradeKey(cur)}: quality ${prevQuality} → ${curQuality}`;
        changes.push(line);
        qualityChanges.push(line);
      } else if (curQuality > prevQuality) {
        qualityImproved += 1;
        const line = `${gradeKey(cur)}: quality ${prevQuality} → ${curQuality}`;
        changes.push(line);
        qualityChanges.push(line);
      }
    }
  }

  return {
    changes,
    gateChanges,
    gatesImproved,
    gatesRegressed,
    qualityChanges,
    qualityImproved,
    qualityRegressed,
  };
};

const regressionVerdict = ({
  coverageIncomplete,
  gatesImproved,
  gatesRegressed,
  qualityImproved,
  qualityRegressed,
}: {
  coverageIncomplete: boolean;
  gatesImproved: number;
  gatesRegressed: number;
  qualityImproved: number;
  qualityRegressed: number;
}): RegressionVerdict => {
  if (gatesRegressed > 0) return "regressed";
  if (coverageIncomplete) return "inconclusive";
  if (qualityRegressed > 0) return "regressed";
  if (gatesImproved > 0 || qualityImproved > 0) return "improved";
  return "unchanged";
};

export const compareRuns = ({
  baselineDir,
  currentDir,
  remediationMode = false,
  crossArm = false,
}: {
  baselineDir: string;
  currentDir: string;
  remediationMode?: boolean;
  crossArm?: boolean;
}) => {
  const baseline = readGrades(baselineDir);
  const current = readGrades(currentDir);
  const baseManifest = readManifest(baselineDir);
  const curManifest = readManifest(currentDir);

  if (!baseline || !current)
    return {
      changes: ["missing scores.json"],
      details: ["missing scores.json"],
      gateChanges: [] as string[],
      improved: 0,
      missingInCurrent: [] as string[],
      missingInBaseline: [] as string[],
      qualityChanges: [] as string[],
      regressed: 0,
      verdict: "inconclusive" as const,
    };

  const manifestNotes: string[] = [];
  if (baseManifest && curManifest) {
    const { compatible, issues, notes } = manifestsCompatible({
      baseline: baseManifest,
      current: curManifest,
      crossArm,
      remediationMode,
    });
    manifestNotes.push(...notes);
    if (!compatible)
      return {
        changes: issues,
        details: issues,
        gateChanges: issues,
        improved: 0,
        manifestNotes,
        missingInCurrent: [],
        missingInBaseline: [],
        qualityChanges: [],
        regressed: 0,
        remediationMode,
        verdict: "inconclusive" as const,
      };
  }

  const byScenario = new Map(baseline.map((g) => [gradeKey(g), g]));
  const currentIds = new Set(current.map((g) => gradeKey(g)));
  const missingInCurrent = [...byScenario.keys()].filter(
    (id) => !currentIds.has(id)
  );
  const missingInBaseline = current
    .map((g) => gradeKey(g))
    .filter((id) => !byScenario.has(id));

  const coverageChanges: string[] = [];
  const coverageGateChanges: string[] = [];
  for (const id of missingInCurrent) {
    const line = `${id}: missing in current run`;
    coverageChanges.push(line);
    coverageGateChanges.push(line);
  }
  for (const id of missingInBaseline) {
    const line = `${id}: missing in baseline run`;
    coverageChanges.push(line);
    coverageGateChanges.push(line);
  }

  const compared = compareScenarioGrades({
    baselineByScenario: byScenario,
    currentGrades: current,
  });
  const coverageIncomplete =
    missingInCurrent.length > 0 || missingInBaseline.length > 0;
  const verdict = regressionVerdict({
    coverageIncomplete,
    gatesImproved: compared.gatesImproved,
    gatesRegressed: compared.gatesRegressed,
    qualityImproved: compared.qualityImproved,
    qualityRegressed: compared.qualityRegressed,
  });

  return {
    changes: [...manifestNotes, ...coverageChanges, ...compared.changes],
    details: [...manifestNotes, ...coverageChanges, ...compared.changes],
    gateChanges: [...coverageGateChanges, ...compared.gateChanges],
    improved: compared.gatesImproved + compared.qualityImproved,
    manifestNotes,
    missingInBaseline,
    missingInCurrent,
    qualityChanges: compared.qualityChanges,
    regressed: compared.gatesRegressed + compared.qualityRegressed,
    remediationMode,
    verdict,
  };
};

export const controlArmValid = ({
  worktreePaths,
}: {
  worktreePaths: string[];
}) => {
  const residuals = worktreePaths.flatMap((p) =>
    listControlResiduals({ worktreePath: p })
  );
  const accepted = new Set(acceptedControlResiduals());
  const unique = [...new Set(residuals)];
  const blocking = unique.filter((r) => !accepted.has(r));
  return { accepted: [...accepted], blocking, residuals: unique };
};

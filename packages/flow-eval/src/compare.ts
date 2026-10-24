import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import type { GradeResult } from "./types.ts";

type RunScores = { grades: GradeResult[] };

const readGrades = (dir: string) => {
  const scoresPath = path.join(dir, "scores.json");
  if (!existsSync(scoresPath)) return null;
  return (JSON.parse(readFileSync(scoresPath, "utf-8")) as RunScores).grades;
};

export type RegressionVerdict =
  | "improved"
  | "regressed"
  | "unchanged"
  | "inconclusive";

export const compareRuns = ({
  baselineDir,
  currentDir,
}: {
  baselineDir: string;
  currentDir: string;
}) => {
  const baseline = readGrades(baselineDir);
  const current = readGrades(currentDir);
  if (!baseline || !current)
    return {
      details: ["missing scores.json"],
      verdict: "inconclusive" as const,
    };

  const byScenario = new Map(baseline.map((g) => [g.scenarioId, g]));
  const changes: string[] = [];
  let improved = 0;
  let regressed = 0;

  for (const cur of current) {
    const prev = byScenario.get(cur.scenarioId);
    if (!prev) {
      changes.push(`${cur.scenarioId}: new scenario`);
      continue;
    }
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
    if (prev.gate === "fail" && cur.gate === "pass") improved += 1;
    if (prev.gate === "pass" && cur.gate === "fail") regressed += 1;
  }

  let verdict: RegressionVerdict = "unchanged";
  if (regressed > improved) verdict = "regressed";
  else if (improved > regressed) verdict = "improved";

  return { changes, improved, regressed, verdict };
};

export const controlResidualScan = ({
  worktreePath,
}: {
  worktreePath: string;
}) => {
  const residuals: string[] = [];
  const flowPath = path.join(worktreePath, "docs/workflow/flow.md");
  if (existsSync(flowPath))
    residuals.push("docs/workflow/flow.md still present");
  const agentsSkills = path.join(worktreePath, "docs/agents/skills.md");
  if (existsSync(agentsSkills))
    residuals.push("docs/agents/skills.md still present");
  const agentsPath = path.join(worktreePath, "AGENTS.md");
  if (existsSync(agentsPath)) {
    const agents = readFileSync(agentsPath, "utf-8");
    if (/Explore → Specify/u.test(agents))
      residuals.push("AGENTS.md still references Explore → Specify");
  }
  return residuals;
};

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

import { devEvalsRoot } from "./paths.ts";
import { redactOrThrow } from "./redact.ts";
import type { GradeResult, RunManifest } from "./types.ts";

export const writeScenarioReport = ({
  runDir,
  scenarioId,
  grade,
}: {
  runDir: string;
  scenarioId: string;
  grade: GradeResult;
}) => {
  const scenarioDir = path.join(runDir, "scenarios", scenarioId);
  mkdirSync(scenarioDir, { recursive: true });
  const scorePath = path.join(scenarioDir, "score.json");
  writeFileSync(scorePath, `${JSON.stringify(grade, null, 2)}\n`);

  const qualityLine =
    grade.quality === null
      ? "withheld (confidence low or unverified dimensions)"
      : `${grade.quality}`;

  const md = `# Scenario ${scenarioId}

Gate: **${grade.gate}**${grade.gateIds.length ? ` (${grade.gateIds.path.join(", ")})` : ""}

Quality: ${qualityLine}

Confidence: ${grade.confidence}

Excluded dimensions: ${grade.excludedDimensions.path.join(", ") || "none"}
`;

  writeFileSync(
    path.join(scenarioDir, "report.md"),
    redactOrThrow({ text: md })
  );
};

export const writeRunSummary = ({
  runDir,
  manifest,
  grades,
}: {
  runDir: string;
  manifest: RunManifest;
  grades: GradeResult[];
}) => {
  mkdirSync(runDir, { recursive: true });
  writeFileSync(
    path.join(runDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  writeFileSync(
    path.join(runDir, "scores.json"),
    `${JSON.stringify({ grades }, null, 2)}\n`
  );

  const lines = [
    "# Flow eval run summary",
    "",
    `Run: ${manifest.runId}`,
    `Arm: ${manifest.arm}`,
    `Harness: ${manifest.harness}`,
    `Completeness: ${manifest.completeness}`,
    "",
    "| Scenario | Gate | Quality | Confidence |",
    "| --- | --- | ---: | --- |",
  ];

  for (const g of grades)
    lines.push(
      `| ${g.scenarioId} | ${g.gate} | ${g.quality ?? "—"} | ${g.confidence} |`
    );

  const failCount = grades.filter((g) => g.gate === "fail").length;
  lines.push("", `Critical gate failures: ${failCount}`);

  writeFileSync(
    path.join(runDir, "summary.md"),
    redactOrThrow({ text: lines.path.join("\n") })
  );
};

export const ensureRunDir = ({ runId }: { runId: string }) => {
  const runDir = path.join(devEvalsRoot, runId);
  if (!existsSync(runDir)) mkdirSync(runDir, { recursive: true });
  return runDir;
};

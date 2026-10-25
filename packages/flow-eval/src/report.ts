import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { redactOrThrow } from "./redact.ts";
import type { CommandEvidence, GradeResult, RunManifest } from "./types.ts";

export const writeScenarioReport = ({
  runDir,
  scenarioId,
  grade,
  commands,
}: {
  runDir: string;
  scenarioId: string;
  grade: GradeResult;
  commands?: CommandEvidence[];
}) => {
  const scenarioDir = path.join(runDir, "scenarios", scenarioId);
  mkdirSync(scenarioDir, { recursive: true });
  writeFileSync(
    path.join(scenarioDir, "score.json"),
    `${JSON.stringify(grade, null, 2)}\n`
  );
  if (commands)
    writeFileSync(
      path.join(scenarioDir, "commands.json"),
      `${JSON.stringify({ commands }, null, 2)}\n`
    );

  const qualityLine =
    grade.quality === null
      ? "withheld (not official-eligible or gate failure)"
      : `${grade.quality} (partial: excludes na/unverified dimensions)`;

  const criterionLines = grade.scores.map((s) => {
    const status =
      s.score === "na"
        ? "na"
        : s.score === "unverified"
          ? "missing"
          : s.score === 0
            ? "not-met"
            : "met";
    return `- ${s.id}: ${status} (score=${String(s.score)}, origin=${s.origin})`;
  });

  const md = `# Scenario ${scenarioId}

Gate: **${grade.gate}**${grade.gateIds.length ? ` (${grade.gateIds.join(", ")})` : ""}

Official eligible: **${grade.officialEligible ? "yes" : "no"}**

Quality: ${qualityLine}

Confidence: ${grade.confidence}

Completeness: ${grade.completeness}

Blockers: ${grade.blockers.join(", ") || "none"}

Excluded dimensions: ${grade.excludedDimensions.join(", ") || "none"}

Unverified dimensions: ${grade.unverifiedDimensions.join(", ") || "none"}

## Criteria (shared outcome vs Flow conformance)

Flow conformance (stage labels, doc paths) is judged separately from shared safety/outcome gates.

${criterionLines.join("\n")}
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
    `Protocol: ${manifest.protocol}`,
    `Completeness: ${manifest.completeness}`,
    "",
    "| Scenario | Gate | Official | Quality | Confidence |",
    "| --- | --- | --- | ---: | --- |",
  ];

  for (const g of grades)
    lines.push(
      `| ${g.scenarioId} | ${g.gate} | ${g.officialEligible ? "yes" : "no"} | ${g.quality ?? "—"} | ${g.confidence} |`
    );

  const failCount = grades.filter((g) => g.gate === "fail").length;
  lines.push("", `Critical gate failures: ${failCount}`);

  writeFileSync(
    path.join(runDir, "summary.md"),
    redactOrThrow({ text: lines.join("\n") })
  );
};

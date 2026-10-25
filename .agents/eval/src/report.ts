import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { redactOrThrow } from "./redact.ts";
import type {
  CommandEvidence,
  GradeResult,
  HostJobStatus,
  RunManifest,
} from "./types.ts";

export const writeScenarioReport = ({
  scenarioDir,
  grade,
  commands,
}: {
  scenarioDir: string;
  grade: GradeResult;
  commands?: CommandEvidence[];
}) => {
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
      ? "not emitted (protocol v2 uses per-outcome fields)"
      : `${grade.quality} (legacy renormalized score)`;

  const outcomeLines = grade.outcomes
    ? [
        `Task outcome: ${grade.outcomes.taskOutcome}`,
        `Verification claim: ${grade.outcomes.verificationClaim}`,
        grade.outcomes.conflictHandling
          ? `Conflict handling: ${grade.outcomes.conflictHandling}`
          : null,
        `Evidence completeness: ${grade.outcomes.evidenceCompleteness}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

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

  const md = `# Scenario ${grade.scenarioId}

Gate: **${grade.gate}**${grade.gateIds.length ? ` (${grade.gateIds.join(", ")})` : ""}

Evidence validity: **${grade.evidenceValidity ?? "—"}**

Comparative eligibility: **${grade.officialEligible ? "yes" : "no"}**

Quality: ${qualityLine}

${outcomeLines ? `${outcomeLines}\n\n` : ""}Confidence: ${grade.confidence}

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
  hostJobs,
  partial = false,
}: {
  runDir: string;
  manifest: RunManifest;
  grades: GradeResult[];
  hostJobs?: {
    scenarioId: string;
    repetition: number;
    status: HostJobStatus;
    attemptId?: number;
    failureReason?: string;
  }[];
  partial?: boolean;
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
    "| Scenario | Gate | Official | Task | Verification | Confidence |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const g of grades)
    lines.push(
      `| ${g.scenarioId} | ${g.gate} | ${g.officialEligible ? "yes" : "no"} | ${g.outcomes?.taskOutcome ?? "—"} | ${g.outcomes?.verificationClaim ?? "—"} | ${g.confidence} |`
    );

  const failCount = grades.filter((g) => g.gate === "fail").length;
  lines.push("", `Critical gate failures: ${failCount}`);

  if (hostJobs?.length) {
    const scheduled = hostJobs.length;
    const completed = hostJobs.filter((j) => j.status === "complete").length;
    const failed = hostJobs.filter((j) => j.status === "failed").length;
    const blocked = hostJobs.filter((j) => j.status === "blocked").length;
    const cancelled = hostJobs.filter((j) => j.status === "cancelled").length;
    const timedOut = hostJobs.filter((j) => j.status === "timed-out").length;
    lines.push(
      "",
      "## Campaign summary",
      "",
      `Scheduled: ${scheduled}`,
      `Completed: ${completed}`,
      `Failed: ${failed}`,
      `Blocked: ${blocked}`,
      `Cancelled: ${cancelled}`,
      `Timed out: ${timedOut}`,
      `Partial finalization: ${partial ? "yes" : "no"}`,
      `Official comparative eligibility: blocked unless isolation and runner capture are demonstrated (see ADR 0015).`
    );
  }

  const highSeverity = grades.filter(
    (g) => g.gate === "fail" || g.evidenceValidity === "invalid"
  );
  if (highSeverity.length) {
    lines.push("", "## Findings", "");
    for (const g of highSeverity)
      lines.push(
        `- **${g.scenarioId}**: gate=${g.gate}, blockers=${g.blockers.join(", ") || "none"}`
      );
  }

  lines.push(
    "",
    "## Prioritized remediation",
    "",
    "Grouped for human approval (not auto-applied):",
    "- Correctness and safety: address gate failures and evidence validity limits first.",
    "- Product workflow: coordinator routing and documentation gaps.",
    "- Evaluation methodology: harness changes require explicit Build authorization.",
    "",
    `Full report: \`${runDir}/summary.md\``
  );

  writeFileSync(
    path.join(runDir, "summary.md"),
    redactOrThrow({ text: lines.join("\n") })
  );
};

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { redactOrThrow } from "../redact.ts";
import { productEvalsRoot } from "./paths.ts";
import { starterRequirements } from "./registry.ts";
import type { ReadinessReport, StressFinding } from "./types.ts";

export const writeProductEvalArtifacts = ({
  runId,
  readiness,
  findings = [],
  summaryExtra = "",
}: {
  runId: string;
  readiness: ReadinessReport;
  findings?: StressFinding[];
  summaryExtra?: string;
}) => {
  const runDir = path.join(productEvalsRoot, runId);
  mkdirSync(path.join(runDir, "agents"), { recursive: true });
  mkdirSync(path.join(runDir, "evidence"), { recursive: true });
  mkdirSync(path.join(runDir, "remediation"), { recursive: true });

  const manifest = {
    evaluatedRevision: readiness.evaluatedRevision,
    mode: "product-readiness",
    runId,
  };
  writeFileSync(
    path.join(runDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  writeFileSync(
    path.join(runDir, "requirements.json"),
    `${JSON.stringify(starterRequirements(), null, 2)}\n`
  );
  writeFileSync(
    path.join(runDir, "readiness.json"),
    `${JSON.stringify(readiness, null, 2)}\n`
  );
  writeFileSync(
    path.join(runDir, "findings.json"),
    `${JSON.stringify(findings, null, 2)}\n`
  );
  writeFileSync(
    path.join(runDir, "evidence", "commands.json"),
    `${JSON.stringify({ evidence: readiness.evidence }, null, 2)}\n`
  );

  const summary = [
    "# Product readiness",
    "",
    `Engineering: ${readiness.engineering}`,
    `Features: ${readiness.features}`,
    `Usability: ${readiness.usability}`,
    "",
    `Required criteria: ${readiness.requiredCriteria}`,
    `Passed: ${readiness.passed}`,
    `Failed: ${readiness.failed}`,
    `Unverified: ${readiness.unverified}`,
    `Blocked: ${readiness.blocked}`,
    "",
    `Release verdict: ${readiness.releaseVerdict}`,
    `Evaluated revision: ${readiness.evaluatedRevision}`,
    summaryExtra,
  ].join("\n");
  writeFileSync(
    path.join(runDir, "summary.md"),
    redactOrThrow({ text: summary })
  );

  return { runDir };
};

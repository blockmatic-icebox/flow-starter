import { spawnSync } from "node:child_process";

import { repoRoot } from "../paths.ts";
import { runAllowlistedCase } from "./execute.ts";
import { allowlistedCases, starterRequirements } from "./registry.ts";
import type {
  DimensionVerdict,
  ReadinessReport,
  RequirementRecord,
} from "./types.ts";

const currentSha = () =>
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).stdout.trim();

const summarizeEvidence = ({
  evidence,
  requirements,
}: {
  evidence: ReturnType<typeof runAllowlistedCase>[];
  requirements: RequirementRecord[];
}) => {
  const blocking = requirements.filter((r) => r.releaseBlocking && !r.nonGoal);
  let passed = 0;
  let failed = 0;
  let unverified = 0;
  const blocked = 0;

  for (const req of blocking) {
    const cases = req.verification;
    if (cases.length === 0) {
      unverified += 1;
      continue;
    }
    const statuses = cases.map((c) => {
      const row = evidence.find((e) => e.caseId === c.caseId);
      return row?.status ?? ("unverified" as const);
    });
    if (statuses.every((s) => s === "passed")) passed += 1;
    else if (statuses.some((s) => s === "failed")) failed += 1;
    else unverified += 1;
  }

  return {
    blocked,
    failed,
    passed,
    requiredCriteria: blocking.length,
    unverified,
  };
};

const dimensionFromKinds = ({
  evidence,
  kinds,
}: {
  evidence: ReturnType<typeof runAllowlistedCase>[];
  kinds: Set<string>;
}) => {
  const rows = evidence.filter((e) =>
    allowlistedCases().some((c) => c.caseId === e.caseId && kinds.has(c.kind))
  );
  if (rows.length === 0) return "INCONCLUSIVE" as DimensionVerdict;
  if (rows.some((r) => r.status === "failed")) return "FAIL";
  if (rows.every((r) => r.status === "passed")) return "PASS";
  return "INCONCLUSIVE";
};

export const evaluateReadiness = ({
  runId,
  caseIds,
}: {
  runId: string;
  caseIds?: string[];
}) => {
  const evaluatedRevision = currentSha();
  const requirements = starterRequirements();
  const selected = allowlistedCases().filter((c) =>
    caseIds?.length ? caseIds.includes(c.caseId) : true
  );
  const evidence = selected.map((caseDef) =>
    runAllowlistedCase({ caseDef, evaluatedSha: evaluatedRevision, runId })
  );

  const counts = summarizeEvidence({ evidence, requirements });
  const engineering = dimensionFromKinds({
    evidence,
    kinds: new Set(["unit", "integration", "security"]),
  });
  const features =
    counts.failed > 0
      ? ("FAIL" as DimensionVerdict)
      : counts.unverified > 0
        ? ("INCONCLUSIVE" as DimensionVerdict)
        : ("PASS" as DimensionVerdict);
  const usability = dimensionFromKinds({
    evidence,
    kinds: new Set(["browser"]),
  });

  let releaseVerdict: ReadinessReport["releaseVerdict"] = "INCONCLUSIVE";
  if (
    engineering === "PASS" &&
    features === "PASS" &&
    usability === "PASS" &&
    counts.failed === 0 &&
    counts.unverified === 0
  )
    releaseVerdict = "READY";
  else if (counts.failed > 0 || features === "FAIL" || usability === "FAIL")
    releaseVerdict = "NOT_READY";

  return {
    blocked: counts.blocked,
    engineering,
    evaluatedRevision,
    evidence,
    failed: counts.failed,
    features,
    passed: counts.passed,
    releaseVerdict,
    requiredCriteria: counts.requiredCriteria,
    unverified: counts.unverified,
    usability,
  } satisfies ReadinessReport;
};

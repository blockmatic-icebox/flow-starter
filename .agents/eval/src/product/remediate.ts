import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

import type { ReadinessReport, StressFinding } from "./types.ts";

export type RepairExecutor = (input: {
  cycle: number;
  findings: StressFinding[];
  workDir: string;
}) => Promise<{ applied: boolean; summary?: string }>;

export type RemediationRecord = {
  cycle: number;
  findings: StressFinding[];
  readiness: ReadinessReport["releaseVerdict"];
  treeHashBefore: string;
  treeHashAfter: string;
  repairSummary?: string;
};

const hashTree = ({ root }: { root: string }) => {
  const parts: string[] = [];
  const walk = (dir: string, rel = "") => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const absolute = path.join(dir, entry);
      const relative = rel ? `${rel}/${entry}` : entry;
      if (statSync(absolute).isDirectory()) walk(absolute, relative);
      else
        parts.push(
          `${relative}:${createHash("sha256").update(readFileSync(absolute)).digest("hex")}`
        );
    }
  };
  walk(root);
  return createHash("sha256").update(parts.toSorted().join("\n")).digest("hex");
};

export const runRemediationLoop = async ({
  evaluate,
  maxRemediationCycles = 3,
  repairExecutor,
  runId,
  workDir,
}: {
  caseIds?: string[];
  evaluate: (input: {
    runId: string;
  }) => ReadinessReport | Promise<ReadinessReport>;
  maxRemediationCycles?: number;
  repairExecutor?: RepairExecutor;
  runId: string;
  workDir?: string;
}) => {
  const remediation: RemediationRecord[] = [];
  let cycle = 0;
  let readiness = await evaluate({ runId: `${runId}-cycle-${cycle}` });
  let findings = findingsFromReadiness(readiness);
  let treeHash = workDir ? hashTree({ root: workDir }) : "";

  const step = async (): Promise<{
    cyclesApplied: number;
    findings: StressFinding[];
    ok: boolean;
    readiness: ReadinessReport;
    remediation: RemediationRecord[];
    stopReason: string;
  }> => {
    const blocking = findings.some(
      (f) => f.severity === "P0" || f.severity === "P1"
    );
    if (readiness.releaseVerdict === "READY")
      return {
        cyclesApplied: remediation.length,
        findings,
        ok: true,
        readiness,
        remediation,
        stopReason: "ready",
      };
    if (!blocking)
      return {
        cyclesApplied: remediation.length,
        findings,
        ok: false,
        readiness,
        remediation,
        stopReason: "insufficient-evidence",
      };
    if (cycle >= maxRemediationCycles)
      return {
        cyclesApplied: remediation.length,
        findings,
        ok: false,
        readiness,
        remediation,
        stopReason: "cycle-limit",
      };
    if (!repairExecutor)
      return {
        cyclesApplied: remediation.length,
        findings,
        ok: false,
        readiness,
        remediation,
        stopReason: "repair-executor-absent",
      };
    if (!workDir)
      return {
        cyclesApplied: remediation.length,
        findings,
        ok: false,
        readiness,
        remediation,
        stopReason: "workdir-missing",
      };

    const failingBefore = readiness.evidence
      .filter((row) => row.status === "failed")
      .map((row) => row.caseId);

    const treeHashBefore = treeHash;
    const repair = await repairExecutor({
      cycle: cycle + 1,
      findings,
      workDir,
    });
    const treeHashAfter = hashTree({ root: workDir });
    if (!repair.applied)
      return {
        cyclesApplied: remediation.length,
        findings,
        ok: false,
        readiness,
        remediation,
        stopReason: "repair-failed",
      };

    cycle += 1;
    readiness = await evaluate({ runId: `${runId}-cycle-${cycle}` });
    findings = findingsFromReadiness(readiness);

    const unresolved = failingBefore.filter((caseId) => {
      const row = readiness.evidence.find((e) => e.caseId === caseId);
      return !row || row.status !== "passed";
    });
    if (unresolved.length > 0 || treeHashAfter === treeHashBefore)
      return {
        cyclesApplied: remediation.length,
        findings,
        ok: false,
        readiness,
        remediation,
        stopReason: unresolved.length > 0 ? "defect-unresolved" : "no-progress",
      };

    treeHash = treeHashAfter;
    remediation.push({
      cycle,
      findings,
      readiness: readiness.releaseVerdict,
      repairSummary: repair.summary,
      treeHashAfter,
      treeHashBefore,
    });
    return step();
  };

  return step();
};

export const findingsFromReadiness = (
  readiness: ReadinessReport
): StressFinding[] =>
  readiness.evidence
    .filter((row) => row.status === "failed")
    .map((row, index) => ({
      confidence: "high" as const,
      expected: row.expected,
      evidence: [row.evidenceRef],
      findingId: `F-EVID-${index + 1}`,
      observed: row.actual,
      reproduction: [row.executionMethod],
      requirementId: row.requirementId,
      severity: "P1" as const,
    }));

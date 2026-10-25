import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { assertAgentAuth } from "../agent.ts";
import type { StressFinding } from "./types.ts";

export const pathsWithinWriteRoot = ({
  workDir,
  writeRoot = "apps/web",
}: {
  workDir: string;
  writeRoot?: string;
}) => {
  const diff = spawnSync("git", ["diff", "--name-only"], {
    cwd: workDir,
    encoding: "utf-8",
  }).stdout;
  const files = diff.split("\n").filter(Boolean);
  const root = `${writeRoot}/`;
  return files.every((f) => f.startsWith(root) || f === writeRoot);
};

export const createCursorRepairExecutor =
  ({
    modelId,
    writeRoot = "apps/web",
  }: {
    modelId: string;
    writeRoot?: string;
  }) =>
  ({
    cycle,
    findings,
    workDir,
  }: {
    cycle: number;
    findings: StressFinding[];
    workDir: string;
  }) => {
    const auth = assertAgentAuth();
    if (!auth.ok)
      return Promise.resolve({ applied: false, summary: auth.reason });

    const prompt = [
      `Repair cycle ${cycle}. Fix only defects in ${writeRoot}/.`,
      "Findings:",
      ...findings.map(
        (f) =>
          `- ${f.findingId} (${f.severity}): expected ${f.expected}; observed ${f.observed}`
      ),
      "Do not modify evaluator, oracle, or packages/flow-eval paths.",
    ].join("\n");

    const logDir = mkdtempSync(path.join(os.tmpdir(), "flow-repair-log-"));
    const rawLog = path.join(logDir, "repair.log");
    writeFileSync(rawLog, "");

    const args = [
      "-p",
      "--output-format",
      "stream-json",
      "--trust",
      "--sandbox",
      "enabled",
      "--workspace",
      workDir,
      "--model",
      modelId,
      prompt,
    ];
    const result = spawnSync("agent", args, {
      cwd: workDir,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 600_000,
    });
    writeFileSync(rawLog, result.stdout || result.stderr || "");

    if (result.status !== 0)
      return Promise.resolve({
        applied: false,
        summary: `repair agent exit ${result.status}`,
      });

    if (!pathsWithinWriteRoot({ workDir, writeRoot }))
      return Promise.resolve({
        applied: false,
        summary: "repair touched unauthorized paths",
      });

    return Promise.resolve({
      applied: true,
      summary: `repair agent completed cycle ${cycle}`,
    });
  };

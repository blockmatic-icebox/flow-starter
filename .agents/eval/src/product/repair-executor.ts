import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

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

const writeHostRepairPacket = ({
  cycle,
  findings,
  runId,
  workDir,
  writeRoot = "apps/web",
}: {
  cycle: number;
  findings: StressFinding[];
  runId: string;
  workDir: string;
  writeRoot?: string;
}) => {
  const prompt = [
    `Repair cycle ${cycle}. Fix only defects in ${writeRoot}/.`,
    "Findings:",
    ...findings.map(
      (f) =>
        `- ${f.findingId} (${f.severity}): expected ${f.expected}; observed ${f.observed}`
    ),
    "Do not modify evaluator, oracle, or .agents/eval paths.",
  ].join("\n");

  const packetDir = path.join(workDir, "__dev", "flow-evals", "repair-packets");
  mkdirSync(packetDir, { recursive: true });
  const packetPath = path.join(packetDir, `${runId}-cycle-${cycle}.json`);
  writeFileSync(
    packetPath,
    `${JSON.stringify(
      {
        cycle,
        dispatch: {
          constraints:
            "No model flag. Dispatch via /flow-eval host-session rules.",
          worktreePath: workDir,
        },
        prompt,
        runId,
        writeRoot,
      },
      null,
      2
    )}\n`
  );
  return { packetPath, prompt };
};

export const createHostRepairExecutor =
  ({ runId, writeRoot = "apps/web" }: { runId: string; writeRoot?: string }) =>
  ({
    cycle,
    findings,
    workDir,
  }: {
    cycle: number;
    findings: StressFinding[];
    workDir: string;
  }) => {
    const { packetPath } = writeHostRepairPacket({
      cycle,
      findings,
      runId,
      workDir,
      writeRoot,
    });
    return Promise.resolve({
      applied: false,
      summary: `host repair packet written: ${packetPath}. Complete via /flow-eval dispatch.`,
    });
  };

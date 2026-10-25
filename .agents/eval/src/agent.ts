import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const agentCliVersion = () => {
  try {
    return spawnSync("agent", ["--version"], {
      encoding: "utf-8",
    }).stdout.trim();
  } catch {
    return "unknown";
  }
};

export const writeSessionMeta = ({
  scenarioDir,
  sessionId,
  worktreePath,
  prepBaseline,
  trialRunnerMeta,
}: {
  scenarioDir: string;
  sessionId?: string;
  worktreePath: string;
  prepBaseline?: { commitSha: string; fingerprint: string };
  trialRunnerMeta?: Record<string, unknown>;
}) => {
  const dir = scenarioDir;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "worktree-path.txt"), `${worktreePath}\n`);
  if (sessionId)
    writeFileSync(path.join(dir, "session-id.txt"), `${sessionId}\n`);
  if (prepBaseline)
    writeFileSync(
      path.join(dir, "prep-baseline.json"),
      `${JSON.stringify(prepBaseline, null, 2)}\n`
    );
  if (trialRunnerMeta)
    writeFileSync(
      path.join(dir, "trial-meta.json"),
      `${JSON.stringify(trialRunnerMeta, null, 2)}\n`
    );
};

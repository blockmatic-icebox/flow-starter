import { spawnSync } from "node:child_process";
import path from "node:path";

import {
  applyScenarioFixture,
  finalizePrepBaseline,
  setupWorktree,
} from "../isolate.ts";
import type { EvalArm } from "../types.ts";

export const runProductSetupInWorktree = ({
  worktreePath,
}: {
  worktreePath: string;
}) => {
  const installAgents = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
    cwd: path.join(worktreePath, ".agents"),
    encoding: "utf-8",
    stdio: "pipe",
  });
  const agentsOut =
    `${installAgents.stdout ?? ""}${installAgents.stderr ?? ""}`.slice(0, 1500);
  if (installAgents.status !== 0)
    throw new Error(
      `pnpm install in .agents failed: ${agentsOut || installAgents.status}`
    );

  const setupEnv = spawnSync(
    process.execPath,
    [".agents/tooling/setup/setup-env.mjs"],
    { cwd: worktreePath, encoding: "utf-8", stdio: "pipe" }
  );
  const envOut = `${setupEnv.stdout ?? ""}${setupEnv.stderr ?? ""}`.slice(
    0,
    1500
  );
  if (setupEnv.status !== 0)
    throw new Error(`setup-env failed: ${envOut || setupEnv.status}`);
};

export const prepareInstalledSubject = ({
  arm,
  copySkills = true,
  flowSha,
  prepareNonce,
  repetition = 1,
  runId,
  scenarioId,
  skipInstall,
  withFixture = true,
  withSetup = true,
}: {
  arm: EvalArm;
  copySkills?: boolean;
  flowSha: string;
  prepareNonce?: string;
  repetition?: number;
  runId: string;
  scenarioId: string;
  skipInstall?: boolean;
  withFixture?: boolean;
  withSetup?: boolean;
}) => {
  const { identity, trialRunnerMeta, worktreeName, worktreePath } =
    setupWorktree({
      arm,
      copySkills,
      flowSha,
      prepareNonce,
      repetition,
      runId,
      scenarioId,
      skipInstall,
    });
  if (withFixture) applyScenarioFixture({ scenarioId, worktreePath });
  if (withSetup && !skipInstall) runProductSetupInWorktree({ worktreePath });
  const prep = finalizePrepBaseline({ worktreePath });
  return {
    identity,
    prep,
    trialRunnerMeta,
    worktreeName,
    worktreePath,
  };
};

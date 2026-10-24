import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { packageDirInRepo, repoRoot, worktreeRoot } from "./paths.ts";
import type { EvalArm } from "./types.ts";

const CONTROL_AGENTS = `# Control arm entrypoint

Act as a senior TypeScript engineer. Follow repository conventions in ARCHITECTURE.md and existing code patterns. Do not invent product scope beyond the user request.
`;

export const setupWorktree = ({
  runId,
  scenarioId,
  flowSha,
  arm,
}: {
  runId: string;
  scenarioId: string;
  flowSha: string;
  arm: EvalArm;
}) => {
  const worktreeName = `eval-${runId}-${scenarioId}`;
  const worktreePath = path.join(worktreeRoot, worktreeName);
  mkdirSync(worktreeRoot, { recursive: true });

  if (existsSync(worktreePath))
    execSync(`git worktree remove --force "${worktreePath}"`, {
      cwd: repoRoot,
      stdio: "inherit",
    });

  execSync(`git worktree add --detach "${worktreePath}" ${flowSha}`, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  const skillsTarget = path.join(repoRoot, ".agents/skills");
  const skillsLink = path.join(worktreePath, ".agents/skills");
  mkdirSync(path.join(worktreePath, ".agents"), { recursive: true });
  if (existsSync(skillsLink))
    rmSync(skillsLink, { force: true, recursive: true });

  if (arm === "flow" && existsSync(skillsTarget))
    symlinkSync(skillsTarget, skillsLink);

  if (arm === "control") {
    writeFileSync(path.join(worktreePath, "AGENTS.md"), CONTROL_AGENTS);
    rmSync(path.join(worktreePath, "docs/workflow/flow.md"), { force: true });
    rmSync(path.join(worktreePath, "docs/agents/skills.md"), { force: true });
  }

  if (arm === "flow-without-skills" && existsSync(skillsLink))
    rmSync(skillsLink, { force: true, recursive: true });

  const evalPkg = path.join(worktreePath, packageDirInRepo);
  if (existsSync(evalPkg)) rmSync(evalPkg, { force: true, recursive: true });

  writeFileSync(
    path.join(worktreePath, ".eval-meta.json"),
    JSON.stringify({ arm, baselineSha: flowSha, runId, scenarioId }, null, 2)
  );

  execSync("pnpm install --frozen-lockfile", {
    cwd: worktreePath,
    stdio: "inherit",
  });

  return { worktreeName, worktreePath };
};

export const applyScenarioFixture = ({
  worktreePath,
  scenarioId,
}: {
  worktreePath: string;
  scenarioId: string;
}) => {
  const fixtureDir = path.join(
    repoRoot,
    packageDirInRepo,
    "fixtures",
    "worktrees",
    scenarioId
  );
  if (!existsSync(fixtureDir)) return;
  execSync(`cp -R "${fixtureDir}/." "${worktreePath}/"`, { stdio: "inherit" });
};

export const captureDiff = ({ worktreePath }: { worktreePath: string }) => {
  try {
    return execSync("git diff HEAD", {
      cwd: worktreePath,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    return "";
  }
};

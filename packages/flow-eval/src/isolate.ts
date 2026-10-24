import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { packageDirInRepo, repoRoot, worktreeRoot } from "./paths.ts";
import type { AgentDiffCapture, EvalArm, PrepBaselineMeta } from "./types.ts";

const CONTROL_AGENTS = `# Control arm entrypoint

Act as a senior TypeScript engineer. Follow repository conventions in ARCHITECTURE.md and existing code patterns. Do not invent product scope beyond the user request.
`;

export const installWorktreeDependencies = ({
  worktreePath,
}: {
  worktreePath: string;
}) => {
  const result = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
    cwd: worktreePath,
    encoding: "utf-8",
    stdio: "pipe",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(0, 2000);
  if (result.error)
    throw new Error(
      `pnpm install failed to start in worktree: ${result.error.message}${output ? `\n${output}` : ""}`
    );
  if (result.signal)
    throw new Error(
      `pnpm install terminated by signal ${result.signal}${output ? `\n${output}` : ""}`
    );
  if (result.status !== 0)
    throw new Error(
      `pnpm install exited with status ${result.status ?? "unknown"}${output ? `\n${output}` : ""}`
    );
};

export const runGit = ({
  cwd,
  args,
  allowFailure,
}: {
  cwd: string;
  args: string[];
  allowFailure?: boolean;
}) => {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (!allowFailure && result.status !== 0)
    throw new Error(`git ${args.join(" ")} failed: ${out.slice(0, 500)}`);
  return { stdout: result.stdout ?? "", status: result.status ?? 1 };
};

const rmDirIfExists = (target: string) => {
  if (existsSync(target)) rmSync(target, { force: true, recursive: true });
};

export const applyArmMutations = ({
  worktreePath,
  arm,
}: {
  worktreePath: string;
  arm: EvalArm;
}) => {
  const skillsTarget = path.join(repoRoot, ".agents/skills");
  const skillsLink = path.join(worktreePath, ".agents/skills");
  mkdirSync(path.join(worktreePath, ".agents"), { recursive: true });
  if (existsSync(skillsLink))
    rmSync(skillsLink, { force: true, recursive: true });

  if (arm === "flow" && existsSync(skillsTarget))
    symlinkSync(skillsTarget, skillsLink);

  if (arm === "control") {
    writeFileSync(path.join(worktreePath, "AGENTS.md"), CONTROL_AGENTS);
    rmDirIfExists(path.join(worktreePath, ".agents/flow"));
    rmDirIfExists(path.join(worktreePath, ".cursor/agents"));
    rmDirIfExists(path.join(worktreePath, ".agents/skills"));
  }

  if (arm === "flow-without-skills") rmDirIfExists(skillsLink);

  const evalPkg = path.join(worktreePath, packageDirInRepo);
  rmDirIfExists(evalPkg);
};

export const setupWorktree = ({
  runId,
  scenarioId,
  flowSha,
  arm,
  skipInstall,
}: {
  runId: string;
  scenarioId: string;
  flowSha: string;
  arm: EvalArm;
  skipInstall?: boolean;
}) => {
  const worktreeName = `eval-${runId}-${scenarioId}`;
  const worktreePath = path.join(worktreeRoot, worktreeName);
  mkdirSync(worktreeRoot, { recursive: true });

  if (existsSync(worktreePath))
    runGit({
      args: ["worktree", "remove", "--force", worktreePath],
      cwd: repoRoot,
    });

  runGit({
    args: ["worktree", "add", "--detach", worktreePath, flowSha],
    cwd: repoRoot,
  });

  applyArmMutations({ arm, worktreePath });

  writeFileSync(
    path.join(worktreePath, ".eval-meta.json"),
    JSON.stringify({ arm, baselineSha: flowSha, runId, scenarioId }, null, 2)
  );

  if (!skipInstall) installWorktreeDependencies({ worktreePath });

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
  cpSync(fixtureDir, worktreePath, { recursive: true });
};

export const finalizePrepBaseline = ({
  worktreePath,
}: {
  worktreePath: string;
}): PrepBaselineMeta => {
  runGit({
    args: ["config", "user.email", "flow-eval@local"],
    cwd: worktreePath,
  });
  runGit({ args: ["config", "user.name", "flow-eval"], cwd: worktreePath });
  runGit({ args: ["add", "-A"], cwd: worktreePath });
  const commit = runGit({
    allowFailure: true,
    args: ["commit", "-m", "flow-eval prep baseline", "--no-verify"],
    cwd: worktreePath,
  });
  if (commit.status !== 0)
    runGit({
      args: [
        "commit",
        "--allow-empty",
        "-m",
        "flow-eval prep baseline",
        "--no-verify",
      ],
      cwd: worktreePath,
    });

  const commitSha = runGit({
    args: ["rev-parse", "HEAD"],
    cwd: worktreePath,
  }).stdout.trim();
  const treeSha = runGit({
    args: ["rev-parse", "HEAD^{tree}"],
    cwd: worktreePath,
  }).stdout.trim();
  const fingerprint = createHash("sha256")
    .update(`${commitSha}:${treeSha}`)
    .digest("hex");

  return {
    commitSha,
    fingerprint,
    recordedAt: new Date().toISOString(),
    treeSha,
  };
};

const diffUntrackedFile = ({ cwd, file }: { cwd: string; file: string }) => {
  const result = spawnSync("git", ["diff", "--no-index", "/dev/null", file], {
    cwd,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return result.stdout ?? "";
};

export const captureAgentDiff = ({
  worktreePath,
  baselineSha,
}: {
  worktreePath: string;
  baselineSha: string;
}): AgentDiffCapture => {
  const patch = runGit({
    args: ["diff", "--find-renames", baselineSha],
    cwd: worktreePath,
  }).stdout;
  const untracked = runGit({
    args: ["ls-files", "--others", "--exclude-standard"],
    cwd: worktreePath,
  })
    .stdout.trim()
    .split("\n")
    .filter(Boolean);
  const untrackedPatches = untracked
    .map((f) => diffUntrackedFile({ cwd: worktreePath, file: f }))
    .join("");
  const statusPorcelain = runGit({
    args: ["status", "--porcelain"],
    cwd: worktreePath,
  }).stdout;
  const commitsAfterBaseline = runGit({
    allowFailure: true,
    args: ["log", "--oneline", `${baselineSha}..HEAD`],
    cwd: worktreePath,
  }).stdout.trim();

  return {
    commitsAfterBaseline,
    patch: `${patch}${untrackedPatches}`,
    statusPorcelain,
  };
};

/** @deprecated use captureAgentDiff */
export const captureDiff = ({ worktreePath }: { worktreePath: string }) =>
  captureAgentDiff({
    baselineSha: runGit({
      args: ["rev-parse", "HEAD"],
      cwd: worktreePath,
    }).stdout.trim(),
    worktreePath,
  }).patch;

export const listControlResiduals = ({
  worktreePath,
}: {
  worktreePath: string;
}) => {
  const residuals: string[] = [];
  if (existsSync(path.join(worktreePath, ".agents/flow")))
    residuals.push(".agents/flow still present");
  const agentsPath = path.join(worktreePath, "AGENTS.md");
  if (existsSync(agentsPath)) {
    const agents = readFileSync(agentsPath, "utf-8");
    if (/Explore → Specify/u.test(agents))
      residuals.push("AGENTS.md still references Explore → Specify");
  }
  if (existsSync(path.join(worktreePath, ".agents/skills")))
    residuals.push(".agents/skills still present");
  if (existsSync(path.join(worktreePath, packageDirInRepo)))
    residuals.push("packages/flow-eval still present");
  return residuals;
};

export const acceptedControlResiduals = () => [
  "skills-lock.json remains in repo",
];

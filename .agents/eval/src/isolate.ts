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

import { evaluatorGitConfig } from "./git-eval-identity.ts";
import { packageDirInRepo, repoRoot, worktreeRoot } from "./paths.ts";
import type { AgentDiffCapture, EvalArm, PrepBaselineMeta } from "./types.ts";

const productAdoptionScript = path.join(
  repoRoot,
  ".agents/tooling/setup/product-adoption.mjs"
);

const neutralWorkspaceSlug = ({
  repetition = 1,
  runId,
  scenarioId,
}: {
  repetition?: number;
  runId: string;
  scenarioId: string;
}) =>
  createHash("sha256")
    .update(`${runId}:${scenarioId}:${repetition}`)
    .digest("hex")
    .slice(0, 12);

export const evalProductName = ({
  repetition = 1,
  runId,
  scenarioId,
}: {
  repetition?: number;
  runId: string;
  scenarioId: string;
}) => `product-${neutralWorkspaceSlug({ repetition, runId, scenarioId })}`;

const applyProductAdoptionToWorktree = ({
  projectName,
  worktreePath,
}: {
  projectName: string;
  worktreePath: string;
}) => {
  const result = spawnSync(
    process.execPath,
    [
      productAdoptionScript,
      "apply",
      "--root",
      worktreePath,
      "--project-name",
      projectName,
    ],
    { encoding: "utf-8" }
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(0, 2000);
  if (result.status !== 0)
    throw new Error(
      `product adoption failed: ${output || `exit ${result.status ?? "unknown"}`}`
    );
  const line = result.stdout.trim().split("\n").at(-1) ?? "{}";
  return JSON.parse(line) as { host: string; slug: string };
};

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
  gitConfig,
  env,
}: {
  cwd: string;
  args: string[];
  allowFailure?: boolean;
  gitConfig?: Record<string, string>;
  env?: NodeJS.ProcessEnv;
}) => {
  const configArgs = gitConfig
    ? Object.entries(gitConfig).flatMap(([key, value]) => [
        "-c",
        `${key}=${value}`,
      ])
    : [];
  const result = spawnSync("git", [...configArgs, ...args], {
    cwd,
    encoding: "utf-8",
    env: env ?? process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (!allowFailure && result.status !== 0)
    throw new Error(`git ${args.join(" ")} failed: ${out.slice(0, 500)}`);
  return {
    output: out,
    stdout: result.stdout ?? "",
    status: result.status ?? 1,
  };
};

const rmDirIfExists = (target: string) => {
  if (existsSync(target)) rmSync(target, { force: true, recursive: true });
};

export const applyArmMutations = ({
  worktreePath,
  arm,
  copySkills = true,
}: {
  worktreePath: string;
  arm: EvalArm;
  copySkills?: boolean;
}) => {
  const skillsTarget = path.join(repoRoot, ".agents/skills");
  const skillsLink = path.join(worktreePath, ".agents/skills");
  mkdirSync(path.join(worktreePath, ".agents"), { recursive: true });
  if (existsSync(skillsLink))
    rmSync(skillsLink, { force: true, recursive: true });

  if (arm === "flow" && existsSync(skillsTarget)) {
    if (copySkills) cpSync(skillsTarget, skillsLink, { recursive: true });
    else symlinkSync(skillsTarget, skillsLink);
  }

  if (arm === "control") {
    writeFileSync(path.join(worktreePath, "AGENTS.md"), CONTROL_AGENTS);
    rmDirIfExists(path.join(worktreePath, ".agents/flow"));
    rmDirIfExists(path.join(worktreePath, ".cursor/agents"));
    rmDirIfExists(path.join(worktreePath, ".agents/skills"));
  }

  if (arm === "flow-without-skills") rmDirIfExists(skillsLink);

  const evalPkg = path.join(worktreePath, packageDirInRepo);
  const evalSource = path.join(repoRoot, packageDirInRepo);
  rmDirIfExists(evalPkg);
  mkdirSync(evalPkg, { recursive: true });
  const sourcePkg = path.join(evalSource, "package.json");
  if (existsSync(sourcePkg))
    cpSync(sourcePkg, path.join(evalPkg, "package.json"));
};

export const setupWorktree = ({
  runId,
  scenarioId,
  flowSha,
  arm,
  copySkills = true,
  skipInstall,
  repetition = 1,
}: {
  runId: string;
  scenarioId: string;
  flowSha: string;
  arm: EvalArm;
  copySkills?: boolean;
  skipInstall?: boolean;
  repetition?: number;
}) => {
  const worktreeName = `ws-${neutralWorkspaceSlug({ repetition, runId, scenarioId })}`;
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

  applyArmMutations({ arm, copySkills, worktreePath });

  const adoption = applyProductAdoptionToWorktree({
    projectName: evalProductName({ repetition, runId, scenarioId }),
    worktreePath,
  });

  const trialRunnerMeta = {
    arm,
    baselineSha: flowSha,
    portlessHost: adoption.host,
    portlessName: adoption.slug,
    productName: evalProductName({ repetition, runId, scenarioId }),
    repetition,
    runId,
    scenarioId,
  };

  if (!skipInstall) installWorktreeDependencies({ worktreePath });

  return { trialRunnerMeta, worktreeName, worktreePath };
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

const isNothingToCommit = (output: string) =>
  /nothing to commit|no changes added to commit/iu.test(output);

const isAuthorIdentityError = (output: string) =>
  /author identity unknown|unable to auto-detect email|please tell me who you are/iu.test(
    output
  );

export const finalizePrepBaseline = ({
  worktreePath,
}: {
  worktreePath: string;
}): PrepBaselineMeta => {
  const baselineGit = evaluatorGitConfig();
  runGit({ args: ["add", "-A"], cwd: worktreePath, gitConfig: baselineGit });
  const commit = runGit({
    allowFailure: true,
    args: ["commit", "-m", "flow-eval prep baseline", "--no-verify"],
    cwd: worktreePath,
    gitConfig: baselineGit,
  });
  if (commit.status !== 0) {
    const out = commit.output;
    if (isAuthorIdentityError(out))
      throw new Error(
        `flow-eval prep baseline commit failed: evaluator git identity misconfigured (${out.slice(0, 300)})`
      );
    if (isNothingToCommit(out))
      runGit({
        args: [
          "commit",
          "--allow-empty",
          "-m",
          "flow-eval prep baseline",
          "--no-verify",
        ],
        cwd: worktreePath,
        gitConfig: baselineGit,
      });
    else
      throw new Error(
        `git commit for flow-eval prep baseline failed: ${out.slice(0, 500)}`
      );
  }

  const commitSha = runGit({
    args: ["rev-parse", "HEAD"],
    cwd: worktreePath,
    gitConfig: baselineGit,
  }).stdout.trim();
  const treeSha = runGit({
    args: ["rev-parse", "HEAD^{tree}"],
    cwd: worktreePath,
    gitConfig: baselineGit,
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
    residuals.push(".agents/eval still present");
  return residuals;
};

export const acceptedControlResiduals = () => [
  "skills-lock.json remains in repo",
];

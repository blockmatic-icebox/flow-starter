import path from "node:path";

const packageRoot = path.resolve(import.meta.dirname, "..");

export const repoRoot = path.resolve(packageRoot, "..", "..");

export const baselineRunId = "20261024-flow-v0.1-1256e532";

export const baselineDevPath = path.join(
  repoRoot,
  "__dev",
  "flow-evals",
  baselineRunId
);

export const devEvalsRoot = path.join(repoRoot, "__dev", "flow-evals");

export const catalogRoot = path.join(devEvalsRoot, "catalog");

export const publicScenariosDir = path.join(packageRoot, "scenarios", "public");

export const baselinesDir = path.join(packageRoot, "baselines");

export const worktreeRoot = path.join(
  process.env.HOME ?? "",
  ".cursor",
  "worktrees",
  "flow-starter"
);

export const packageDirInRepo = "packages/flow-eval";

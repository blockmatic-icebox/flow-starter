import { existsSync } from "node:fs";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dirname, "..");

export const repoRoot = path.resolve(packageRoot, "..", "..");

export const baselineRunId = "20261024-flow-v0.1-1256e532";

const legacyEvalsRoot = path.join(repoRoot, "__dev", "flow-evals");

const evalEvidenceRoot = path.join(packageRoot, "evidence", "flow-evals");

/** Default write root for new methodology evaluation runs. */
export const devEvalsRoot = evalEvidenceRoot;

export const baselineDevPath = path.join(legacyEvalsRoot, baselineRunId);

export const runEvalDir = (runId: string) => {
  const primary = path.join(evalEvidenceRoot, runId);
  const legacy = path.join(legacyEvalsRoot, runId);
  if (existsSync(primary)) return primary;
  if (existsSync(legacy)) return legacy;
  return primary;
};

export const catalogRoot = existsSync(path.join(legacyEvalsRoot, "catalog"))
  ? path.join(legacyEvalsRoot, "catalog")
  : path.join(evalEvidenceRoot, "catalog");

export const publicScenariosDir = path.join(packageRoot, "scenarios", "public");

export const oraclesDir = path.join(packageRoot, "scenarios", "oracles");

export const baselinesDir = path.join(packageRoot, "baselines");

export const worktreeRoot = path.join(
  process.env.HOME ?? "",
  ".cursor",
  "worktrees",
  "flow-starter"
);

export const packageDirInRepo = ".agents/eval";

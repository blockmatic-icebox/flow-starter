import { existsSync } from "node:fs";
import path from "node:path";

import { repoRoot } from "../paths.ts";

const packageRoot = path.resolve(import.meta.dirname, "..", "..");

const legacyProductEvalsRoot = path.join(repoRoot, "__dev", "product-evals");

const productEvalEvidenceRoot = path.join(
  packageRoot,
  "evidence",
  "product-evals"
);

/** Default write root for new product acceptance evaluation runs. */
export const productEvalsRoot = productEvalEvidenceRoot;

export const productRunDir = (runId: string) => {
  const primary = path.join(productEvalEvidenceRoot, runId);
  const legacy = path.join(legacyProductEvalsRoot, runId);
  if (existsSync(primary)) return primary;
  if (existsSync(legacy)) return legacy;
  return primary;
};

export const benchmarkFixturesRoot = path.join(
  repoRoot,
  ".agents/eval/fixtures/benchmarks"
);

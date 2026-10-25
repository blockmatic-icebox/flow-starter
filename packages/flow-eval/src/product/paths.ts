import path from "node:path";

import { repoRoot } from "../paths.ts";

export const productEvalsRoot = path.join(repoRoot, "__dev", "product-evals");

export const benchmarkFixturesRoot = path.join(
  repoRoot,
  "packages/flow-eval/fixtures/benchmarks"
);

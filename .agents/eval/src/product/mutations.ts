import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { repoRoot } from "../paths.ts";
import { runProductOutcomeCheck } from "../product-outcome.ts";
import { benchmarkFixturesRoot } from "./paths.ts";

export type MutationCase = {
  id: string;
  expectFail: boolean;
  prepare?: (worktreePath: string) => void;
};

const listingsFixture = path.join(
  repoRoot,
  ".agents/eval/fixtures/worktrees/S13"
);

const copyFixture = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "flow-mutation-"));
  cpSync(listingsFixture, dir, { recursive: true });
  return dir;
};

const fixSort = (worktreePath: string) => {
  const file = path.join(worktreePath, "packages/genui/src/listings-sort.ts");
  writeFileSync(
    file,
    `export const sortListingsByPriceAsc = (prices: number[]) =>
  [...prices].toSorted((a, b) => a - b);\n`
  );
};

const mutationCases = (): MutationCase[] => [
  {
    id: "reversed-sort",
    expectFail: true,
  },
  {
    id: "fixed-sort",
    expectFail: false,
    prepare: (worktreePath) => fixSort(worktreePath),
  },
  {
    id: "comment-only",
    expectFail: true,
    prepare: (worktreePath) => {
      const file = path.join(
        worktreePath,
        "packages/genui/src/listings-sort.ts"
      );
      const content = readFileSync(file, "utf-8");
      writeFileSync(file, `// noop\n${content}`);
    },
  },
];

export const runMutationIntegrity = () => {
  const results = [];
  for (const caseDef of mutationCases()) {
    const worktreePath = copyFixture();
    try {
      caseDef.prepare?.(worktreePath);
      const check = runProductOutcomeCheck({
        checkId: "listings-sort-asc",
        worktreePath,
      });
      const passed = check.ok;
      const ok = caseDef.expectFail ? !passed : passed;
      results.push({ id: caseDef.id, ok, passed });
    } finally {
      rmSync(worktreePath, { force: true, recursive: true });
    }
  }
  return {
    ok: results.every((r) => r.ok),
    results,
  };
};

export const runOfflineBenchmark = ({
  benchmarkId,
}: {
  benchmarkId: "benchmark-a" | "benchmark-b";
}) => {
  const manifestPath = path.join(
    benchmarkFixturesRoot,
    benchmarkId,
    "manifest.json"
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
    title: string;
    worktreeFixture: string;
    expectProductCheck: boolean;
  };
  const worktreePath = path.join(
    benchmarkFixturesRoot,
    benchmarkId,
    manifest.worktreeFixture
  );
  const check = runProductOutcomeCheck({
    checkId: "listings-sort-asc",
    worktreePath,
  });
  return {
    benchmarkId,
    ok: manifest.expectProductCheck ? check.ok : !check.ok,
    title: manifest.title,
  };
};

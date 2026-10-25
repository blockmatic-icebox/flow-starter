import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { repoRoot } from "./paths.ts";

export type ProductOutcomeCheckId = "listings-sort-asc";

const listingsSortAscScript = `
import { pathToFileURL } from "node:url";
const root = process.env.FLOW_EVAL_WORKTREE;
const mod = await import(pathToFileURL(\`\${root}/packages/genui/src/listings-sort.ts\`).href);
const { sortListingsByPriceAsc } = mod;
const input = [3, 1, 2, 2, -1, 0];
const snapshot = JSON.stringify(input);
const out = sortListingsByPriceAsc(input);
if (JSON.stringify(input) !== snapshot) throw new Error("mutated input");
const expected = [-1, 0, 1, 2, 2, 3];
if (JSON.stringify(out) !== JSON.stringify(expected))
  throw new Error(\`wrong order: \${JSON.stringify(out)}\`);
`;

export const runProductOutcomeCheck = ({
  checkId,
  worktreePath,
}: {
  checkId: ProductOutcomeCheckId;
  worktreePath: string;
}) => {
  if (checkId !== "listings-sort-asc")
    return { ok: false, reason: `unknown check ${checkId}` };

  const modulePath = path.join(
    worktreePath,
    "packages/genui/src/listings-sort.ts"
  );
  if (!existsSync(modulePath))
    return { ok: false, reason: "missing listings-sort.ts in worktree" };

  const result = spawnSync(
    "pnpm",
    ["exec", "tsx", "--input-type=module", "-e", listingsSortAscScript],
    {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 30_000,
      env: { ...process.env, FLOW_EVAL_WORKTREE: worktreePath },
    }
  );

  if (result.status !== 0)
    return {
      command: "evaluator:listings-sort-asc",
      exitCode: result.status ?? 1,
      ok: false,
      reason: (result.stderr || result.stdout || "check failed").trim(),
    };

  return {
    command: "evaluator:listings-sort-asc",
    exitCode: 0,
    ok: true,
  };
};

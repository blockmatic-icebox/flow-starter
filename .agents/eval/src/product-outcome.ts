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
const cases = [
  { input: [], expected: [] },
  { input: [3, 1, 2], expected: [1, 2, 3] },
  { input: [2, 2, -1, 0], expected: [-1, 0, 2, 2] },
  { input: [1, 2, 3], expected: [1, 2, 3] },
  { input: [0], expected: [0] },
];
for (const { input, expected } of cases) {
  const snapshot = JSON.stringify(input);
  const out = sortListingsByPriceAsc(input);
  if (JSON.stringify(input) !== snapshot) throw new Error("mutated input");
  if (JSON.stringify(out) !== JSON.stringify(expected))
    throw new Error(\`wrong order for \${JSON.stringify(input)}: \${JSON.stringify(out)}\`);
}
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
      env: { ...process.env, FLOW_EVAL_WORKTREE: worktreePath },
      stdio: "pipe",
      timeout: 30_000,
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

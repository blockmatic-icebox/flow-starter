import { execSync } from "node:child_process";
import path from "node:path";

import { defineEval } from "eve/evals";

const repoRoot = path.join(import.meta.dirname, "..", "..");

export default defineEval({
  description:
    "GenUI compose package tests pass (includes support-dashboard routing).",
  tags: ["smoke"],
  test(t) {
    execSync("pnpm --filter @repo/genui test", {
      cwd: repoRoot,
      stdio: "inherit",
    });
    t.succeeded();
  },
});

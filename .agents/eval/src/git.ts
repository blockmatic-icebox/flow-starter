import { spawnSync } from "node:child_process";

import { repoRoot } from "./paths.ts";

export const currentFlowSha = () =>
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).stdout.trim();

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { repoRoot } from "./paths.ts";

export const skillsLockHash = () => {
  const lockPath = path.join(repoRoot, ".agents/skills-lock.json");
  if (!existsSync(lockPath)) return "skills-lock-missing";
  return createHash("sha256").update(readFileSync(lockPath)).digest("hex");
};

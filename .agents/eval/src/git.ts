import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { catalogRoot, publicScenariosDir, repoRoot } from "./paths.ts";
import { catalogHash, scenarioOracleHash } from "./scenarios.ts";
import { skillsLockHash } from "./skills-lock.ts";
import type { CommonSourceIdentity } from "./types.ts";

export const currentFlowSha = () =>
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).stdout.trim();

const fixtureTreeHash = () => {
  const fixturesRoot = path.join(repoRoot, ".agents/eval/fixtures/worktrees");
  if (!existsSync(fixturesRoot)) return "fixtures-missing";
  const parts: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).toSorted()) {
      const full = path.join(dir, name);
      if (name === ".git") continue;
      if (statSync(full).isDirectory()) walk(full);
      else parts.push(readFileSync(full, "utf-8"));
    }
  };
  walk(fixturesRoot);
  return createHash("sha256").update(parts.join("\n")).digest("hex");
};

const commonSourceFingerprint = () =>
  createHash("sha256")
    .update(
      [
        existsSync(publicScenariosDir)
          ? readdirSync(publicScenariosDir)
              .filter((n) => n.endsWith(".json"))
              .toSorted()
              .map((n) =>
                readFileSync(path.join(publicScenariosDir, n), "utf-8")
              )
              .join("\n")
          : "",
        scenarioOracleHash(),
        catalogHash(),
        fixtureTreeHash(),
        skillsLockHash(),
        existsSync(catalogRoot) ? "catalog-present" : "catalog-missing",
      ].join("|")
    )
    .digest("hex");

export const recordCommonSource = (): CommonSourceIdentity => ({
  commitSha: currentFlowSha(),
  fingerprint: commonSourceFingerprint(),
  recordedAt: new Date().toISOString(),
});

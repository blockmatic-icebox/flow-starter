import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let loaded = false;
let repoRoot: string | null = null;

const resolveRepoRoot = () => {
  if (repoRoot) return repoRoot;
  const moduleDir = import.meta.dirname;
  if (!moduleDir) return null;
  repoRoot = path.join(moduleDir, "..", "..", "..");
  return repoRoot;
};

export const loadRootEnv = () => {
  if (loaded) return;
  const root = resolveRepoRoot();
  if (!root) return;
  for (const name of [".env", ".env.local"]) {
    const envPath = path.join(root, name);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
  loaded = true;
};

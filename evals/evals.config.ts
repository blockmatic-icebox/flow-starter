import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { defineEvalConfig } from "eve/evals";

const loadRootEnv = (root: string) => {
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
};

export default defineEvalConfig({
  setup() {
    const root = new URL("..", import.meta.url).pathname;
    loadRootEnv(root);
    const evalUrl = process.env.EVE_EVAL_DATABASE_URL?.trim();
    const env = evalUrl
      ? { ...process.env, DATABASE_URL: evalUrl }
      : process.env;
    execSync("pnpm db:migrate", {
      cwd: root,
      env,
      stdio: "inherit",
    });
    execSync("FI_SEED_IF_EMPTY=1 pnpm seed:fi", {
      cwd: root,
      env: { ...env, FI_SEED_IF_EMPTY: "1" },
      stdio: "inherit",
    });
    return { root };
  },
});

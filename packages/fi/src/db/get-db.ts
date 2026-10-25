import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDb } from "@repo/db";
import type { AppDatabase } from "@repo/db";

const repoRoot = path.join(
  // oxlint-disable-next-line unicorn/prefer-import-meta-properties -- Next webpack bundle lacks import.meta.dirname
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  ".."
);

let loaded = false;

export const loadRootEnv = () => {
  if (loaded) return;
  for (const name of [".env", ".env.local"]) {
    const envPath = path.join(repoRoot, name);
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

export const getDb = (): AppDatabase => {
  loadRootEnv();
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required");
  return createDb({ url }).db;
};

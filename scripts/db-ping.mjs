#!/usr/bin/env node

import { join } from "node:path";
import { exit } from "node:process";

import { createDb } from "@repo/db/client";

import { loadDotenv } from "./load-dotenv.mjs";

const repoRoot = join(import.meta.dirname, "..");
const defaultUrl = "postgres://neon:npg@localhost:5432/neondb?sslmode=require";

async function main() {
  loadDotenv({ root: repoRoot });

  const url = process.env.DATABASE_URL ?? defaultUrl;
  const env = { ...process.env };
  const localProxy =
    /\/\/(?:[^/@]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/u.test(url);
  if (env.NODE_ENV !== "production" && localProxy)
    env.DATABASE_TLS_INSECURE_LOCAL ??= "1";
  const { sql } = createDb({ env, url });

  try {
    const [row] = await sql`select 1 as ok`;
    if (String(row?.ok) !== "1") {
      throw new Error("unexpected ping result");
    }
    console.log("Database ping OK");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

try {
  await main();
} catch (error) {
  const detail = error instanceof Error ? error.message : "connection failed";
  const safe = /postgres(?:ql)?:|password|secret/iu.test(detail)
    ? "connection failed"
    : detail;
  console.error(`\nDatabase ping failed: ${safe}\n`);
  exit(1);
}

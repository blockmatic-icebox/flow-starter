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
  const { sql } = createDb({ url });

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
  console.error(`\nDatabase ping failed: ${error.message}\n`);
  exit(1);
}

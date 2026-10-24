import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

const localHosts = new Set(["localhost", "127.0.0.1"]);

export function createDb({ url }: { url: string }) {
  const parsed = new URL(url.replace(/^postgres:/u, "postgresql:"));
  const ssl = localHosts.has(parsed.hostname)
    ? { rejectUnauthorized: false }
    : undefined;

  const sql = postgres(url, { max: 1, ssl });
  const db = drizzle(sql, { schema });

  return { db, sql };
}

export type AppDatabase = ReturnType<typeof createDb>["db"];

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export const resolveDatabaseConnection = ({
  env,
  url,
}: {
  env: NodeJS.ProcessEnv;
  url: string;
}) => {
  let parsed: URL;
  try {
    parsed = new URL(url.replace(/^postgres:/u, "postgresql:"));
  } catch {
    return { ok: false as const, reason: "invalid_url" as const };
  }
  if (!parsed.hostname)
    return { ok: false as const, reason: "invalid_url" as const };

  const isLoopback = loopbackHosts.has(parsed.hostname);
  const explicitLocal =
    env.NODE_ENV !== "production" && env.DATABASE_TLS_INSECURE_LOCAL === "1";
  const insecureLocal = explicitLocal && isLoopback;
  if (insecureLocal)
    return {
      insecureTls: true,
      ok: true as const,
      ssl: { rejectUnauthorized: false as const },
    };

  if (!isLoopback)
    return { insecureTls: false, ok: true as const, ssl: "require" as const };

  return { insecureTls: false, ok: true as const, ssl: undefined };
};

export function createDb({
  env = process.env,
  url,
}: {
  env?: NodeJS.ProcessEnv;
  url: string;
}) {
  const resolved = resolveDatabaseConnection({ env, url });
  if (!resolved.ok) throw new Error("invalid-database-url");

  const sql = postgres(url, { max: 1, ssl: resolved.ssl });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type AppDatabase = ReturnType<typeof createDb>["db"];

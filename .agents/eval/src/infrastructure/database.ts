import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import type { SubjectIdentity } from "../subject-identity.ts";
import { isOwnedEvalDatabaseName } from "../subject-identity.ts";
import {
  assertSubjectDatabaseUrl,
  buildSubjectDatabaseUrl,
  defaultAdminDatabaseUrl,
  redactDatabaseUrl,
} from "./connection-url.ts";
import {
  activeDatabasesForRun,
  loadDatabaseRegistry,
  markDatabaseDropped,
  registerSubjectDatabase,
} from "./database-registry.ts";
import { ensureNeonLocalReady } from "./neon-local.ts";
import { connectPostgres, pingDatabase } from "./postgres-client.ts";
import {
  readSubjectDatabaseUrl,
  subjectProcessEnv,
  writeSubjectEnvFile,
} from "./subject-env.ts";

export type DatabaseLifecycleStatus = {
  cleanup: "passed" | "failed" | "skipped" | "unknown";
  integration: "passed" | "failed" | "skipped" | "unknown";
  isolated: boolean;
  migrations: "passed" | "failed" | "skipped" | "unknown";
  name: string;
  provider: "neon-local";
  provisioned: boolean;
  seed: "passed" | "failed" | "skipped" | "unknown";
};

export type SubjectDatabaseRecord = {
  databaseName: string;
  databaseUrl: string;
  lifecycle: DatabaseLifecycleStatus;
  redactedUrl: string;
  subjectKey: string;
  worktreePath: string;
};

const retainDatabases = () => process.env.FLOW_EVAL_RETAIN_DB === "1";

const quoteIdent = (name: string) => {
  if (!/^[a-z_][a-z0-9_]*$/iu.test(name))
    throw new Error(`invalid SQL identifier: ${name}`);
  return `"${name.replaceAll('"', '""')}"`;
};

export const createDatabaseIfNotExists = async ({
  adminUrl,
  databaseName,
}: {
  adminUrl: string;
  databaseName: string;
}) => {
  if (!isOwnedEvalDatabaseName(databaseName))
    throw new Error(`refusing to create database: ${databaseName}`);
  const sql = connectPostgres({ url: adminUrl });
  try {
    const existing = await sql`
      select 1 from pg_database where datname = ${databaseName}
    `;
    if (existing.length === 0)
      await sql.unsafe(`create database ${quoteIdent(databaseName)}`);
  } finally {
    await sql.end({ timeout: 10 });
  }
};

export const dropOwnedDatabase = async ({
  adminUrl,
  databaseName,
  runId,
}: {
  adminUrl: string;
  databaseName: string;
  runId: string;
}) => {
  if (!isOwnedEvalDatabaseName(databaseName))
    throw new Error(`refusing to drop database: ${databaseName}`);
  const registry = loadDatabaseRegistry({ runId });
  const owned = registry.entries.some(
    (e) => e.databaseName === databaseName && e.status === "active"
  );
  if (!owned)
    throw new Error(`database ${databaseName} not owned by run ${runId}`);

  const sql = connectPostgres({ url: adminUrl });
  try {
    await sql`
      select pg_terminate_backend(pid)
      from pg_stat_activity
      where datname = ${databaseName} and pid <> pg_backend_pid()
    `.catch(() => undefined);
    await sql.unsafe(`drop database if exists ${quoteIdent(databaseName)}`);
  } finally {
    await sql.end({ timeout: 10 });
  }
  markDatabaseDropped({ databaseName, runId });
};

export const provisionSubjectDatabase = async ({
  adminUrl = defaultAdminDatabaseUrl(),
  identity,
  runId,
  worktreePath,
}: {
  adminUrl?: string;
  identity: SubjectIdentity;
  runId: string;
  worktreePath: string;
}) => {
  await ensureNeonLocalReady({ adminUrl });
  await createDatabaseIfNotExists({
    adminUrl,
    databaseName: identity.databaseName,
  });
  registerSubjectDatabase({
    databaseName: identity.databaseName,
    runId,
    subjectKey: identity.subjectKey,
  });

  const databaseUrl = buildSubjectDatabaseUrl({
    databaseName: identity.databaseName,
  });
  assertSubjectDatabaseUrl({
    databaseName: identity.databaseName,
    url: databaseUrl,
  });
  writeSubjectEnvFile({
    databaseName: identity.databaseName,
    databaseUrl,
    worktreePath,
  });

  const lifecycle: DatabaseLifecycleStatus = {
    cleanup: "unknown",
    integration: "unknown",
    isolated: true,
    migrations: "unknown",
    name: identity.databaseName,
    provider: "neon-local",
    provisioned: true,
    seed: "skipped",
  };

  return {
    databaseName: identity.databaseName,
    databaseUrl,
    lifecycle,
    redactedUrl: redactDatabaseUrl(databaseUrl),
    subjectKey: identity.subjectKey,
    worktreePath,
  } satisfies SubjectDatabaseRecord;
};

export const migrateSubjectDatabase = ({
  worktreePath,
}: {
  worktreePath: string;
}) => {
  const databaseUrl = readSubjectDatabaseUrl(worktreePath);
  if (!databaseUrl)
    throw new Error("missing subject DATABASE_URL for migration");
  const result = spawnSync("pnpm", ["db:migrate"], {
    cwd: worktreePath,
    encoding: "utf-8",
    env: subjectProcessEnv({ databaseUrl, worktreePath }),
    stdio: "pipe",
    timeout: 300_000,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(0, 2000);
  if (result.status !== 0)
    throw new Error(`db:migrate failed: ${output || `exit ${result.status}`}`);
};

export const verifySubjectDatabase = async ({
  worktreePath,
}: {
  worktreePath: string;
}) => {
  const databaseUrl = readSubjectDatabaseUrl(worktreePath);
  if (!databaseUrl)
    throw new Error("missing subject DATABASE_URL for verification");
  const marker = `flow-eval-${randomUUID()}`;
  const sql = connectPostgres({ url: databaseUrl });
  try {
    await pingDatabase({ sql });
    await sql`
      insert into app_meta (id, value) values (${marker}, ${"isolated"})
      on conflict (id) do update set value = excluded.value
    `;
    const rows = await sql`
      select value from app_meta where id = ${marker}
    `;
    if (rows[0]?.value !== "isolated")
      throw new Error("app_meta verification read failed");
  } finally {
    await sql.end({ timeout: 10 });
  }
};

export const cleanupSubjectDatabase = async ({
  adminUrl = defaultAdminDatabaseUrl(),
  databaseName,
  runId,
}: {
  adminUrl?: string;
  databaseName: string;
  runId: string;
}) => {
  if (retainDatabases()) return { cleanup: "skipped" as const };
  try {
    await dropOwnedDatabase({ adminUrl, databaseName, runId });
    return { cleanup: "passed" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { cleanup: "failed" as const, reason: message };
  }
};

export const reconcileDatabaseRegistry = async ({
  adminUrl = defaultAdminDatabaseUrl(),
  runId,
}: {
  adminUrl?: string;
  runId: string;
}) => {
  const active = activeDatabasesForRun({ runId });
  if (active.length === 0) return { reconciled: 0 };
  const sql = connectPostgres({ url: adminUrl });
  let reconciled = 0;
  try {
    await Promise.all(
      active.map(async (entry) => {
        const rows = await sql`
          select 1 from pg_database where datname = ${entry.databaseName}
        `;
        if (rows.length === 0) {
          markDatabaseDropped({ databaseName: entry.databaseName, runId });
          reconciled += 1;
        }
      })
    );
  } finally {
    await sql.end({ timeout: 10 });
  }
  return { reconciled };
};

/** @deprecated use reconcileDatabaseRegistry */
export const recoverOrphanedDatabases = reconcileDatabaseRegistry;

export const cleanupOrphanedDatabasesForRun = async ({
  adminUrl = defaultAdminDatabaseUrl(),
  runId,
}: {
  adminUrl?: string;
  runId: string;
}) => {
  const active = activeDatabasesForRun({ runId });
  const results = await Promise.all(
    active.map(async (entry) => {
      const outcome = await cleanupSubjectDatabase({
        adminUrl,
        databaseName: entry.databaseName,
        runId,
      });
      return {
        cleanup: outcome.cleanup,
        databaseName: entry.databaseName,
        reason: "reason" in outcome ? outcome.reason : undefined,
      };
    })
  );
  return {
    dropped: results.filter((r) => r.cleanup === "passed").length,
    results,
    skipped: results.filter((r) => r.cleanup === "skipped").length,
  };
};

export const prepareSubjectDatabase = async ({
  identity,
  runId,
  worktreePath,
}: {
  identity: SubjectIdentity;
  runId: string;
  worktreePath: string;
}) => {
  await reconcileDatabaseRegistry({ runId });
  const record = await provisionSubjectDatabase({
    identity,
    runId,
    worktreePath,
  });
  try {
    migrateSubjectDatabase({ worktreePath });
    record.lifecycle.migrations = "passed";
    await verifySubjectDatabase({ worktreePath });
    record.lifecycle.integration = "passed";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (record.lifecycle.migrations === "unknown")
      record.lifecycle.migrations = "failed";
    else record.lifecycle.integration = "failed";
    await cleanupSubjectDatabase({
      databaseName: identity.databaseName,
      runId,
    });
    record.lifecycle.cleanup = retainDatabases() ? "skipped" : "passed";
    throw new Error(message, { cause: error });
  }
  return record;
};

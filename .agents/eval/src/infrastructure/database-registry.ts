import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { runEvalDir } from "../paths.ts";
import { isOwnedEvalDatabaseName } from "../subject-identity.ts";

export type DatabaseRegistryEntry = {
  databaseName: string;
  provisionedAt: string;
  runId: string;
  status: "active" | "dropped" | "failed";
  subjectKey: string;
};

export type DatabaseRegistry = {
  entries: DatabaseRegistryEntry[];
  runId: string;
  updatedAt: string;
};

const registryPath = ({ runId }: { runId: string }) =>
  path.join(runEvalDir(runId), "database-registry.json");

export const loadDatabaseRegistry = ({
  runId,
}: {
  runId: string;
}): DatabaseRegistry => {
  const file = registryPath({ runId });
  if (!existsSync(file))
    return { entries: [], runId, updatedAt: new Date().toISOString() };
  return JSON.parse(readFileSync(file, "utf-8")) as DatabaseRegistry;
};

export const saveDatabaseRegistry = ({
  registry,
}: {
  registry: DatabaseRegistry;
}) => {
  const dir = runEvalDir(registry.runId);
  mkdirSync(dir, { recursive: true });
  const next = { ...registry, updatedAt: new Date().toISOString() };
  writeFileSync(
    registryPath({ runId: registry.runId }),
    `${JSON.stringify(next, null, 2)}\n`
  );
  return next;
};

export const registerSubjectDatabase = ({
  databaseName,
  runId,
  subjectKey,
}: {
  databaseName: string;
  runId: string;
  subjectKey: string;
}) => {
  if (!isOwnedEvalDatabaseName(databaseName))
    throw new Error(`refusing to register non-eval database: ${databaseName}`);
  const registry = loadDatabaseRegistry({ runId });
  const existing = registry.entries.find(
    (e) => e.databaseName === databaseName && e.status === "active"
  );
  if (existing) return { entry: existing, registry };

  const entry: DatabaseRegistryEntry = {
    databaseName,
    provisionedAt: new Date().toISOString(),
    runId,
    status: "active",
    subjectKey,
  };
  const next = saveDatabaseRegistry({
    registry: { ...registry, entries: [...registry.entries, entry] },
  });
  return { entry, registry: next };
};

export const markDatabaseDropped = ({
  databaseName,
  runId,
}: {
  databaseName: string;
  runId: string;
}) => {
  const registry = loadDatabaseRegistry({ runId });
  const entries = registry.entries.map((e) =>
    e.databaseName === databaseName && e.status === "active"
      ? { ...e, status: "dropped" as const }
      : e
  );
  return saveDatabaseRegistry({ registry: { ...registry, entries } });
};

export const activeDatabasesForRun = ({ runId }: { runId: string }) =>
  loadDatabaseRegistry({ runId }).entries.filter((e) => e.status === "active");

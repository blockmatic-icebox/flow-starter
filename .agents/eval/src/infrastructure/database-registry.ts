import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

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

const lockPath = ({ runId }: { runId: string }) =>
  `${registryPath({ runId })}.lock`;

const LOCK_STALE_MS = 120_000;
const LOCK_RETRY_MS = 25;
const LOCK_MAX_ATTEMPTS = 200;

const sleep = (ms: number) => delay(ms);

const parseLockPayload = (raw: string) => {
  const [pidPart, timePart] = raw.trim().split(":");
  return {
    pid: Number(pidPart),
    stamped: Number(timePart),
    token: raw.trim(),
  };
};

const tryRemoveStaleLock = ({ file }: { file: string }) => {
  if (!existsSync(file)) return;
  const stat = readFileSync(file, "utf-8");
  const { stamped } = parseLockPayload(stat);
  if (Number.isFinite(stamped) && Date.now() - stamped > LOCK_STALE_MS)
    rmSync(file, { force: true });
};

const acquireRegistryLock = async ({ runId }: { runId: string }) => {
  const file = lockPath({ runId });
  mkdirSync(runEvalDir(runId), { recursive: true });
  const token = `${process.pid}:${Date.now()}:${randomUUID()}`;
  for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt += 1) {
    try {
      writeFileSync(file, `${token}\n`, { flag: "wx" });
      return () => {
        try {
          if (!existsSync(file)) return;
          const current = readFileSync(file, "utf-8").trim();
          if (current === token) rmSync(file, { force: true });
        } catch {
          /* ignore */
        }
      };
    } catch {
      tryRemoveStaleLock({ file });
      // eslint-disable-next-line no-await-in-loop -- lock acquisition must retry serially
      await sleep(LOCK_RETRY_MS);
    }
  }
  throw new Error(`database registry lock timeout for run ${runId}`);
};

export const withDatabaseRegistryLock = async <T>({
  runId,
  fn,
}: {
  runId: string;
  fn: () => T | Promise<T>;
}) => {
  const release = await acquireRegistryLock({ runId });
  try {
    return await fn();
  } finally {
    release();
  }
};

const assertRegistryShape = ({
  registry,
  runId,
}: {
  registry: DatabaseRegistry;
  runId: string;
}) => {
  if (registry.runId !== runId)
    throw new Error(
      `registry runId mismatch: expected ${runId}, got ${registry.runId}`
    );
  if (!Array.isArray(registry.entries))
    throw new Error("registry entries must be an array");
  const activeNames = new Set<string>();
  for (const entry of registry.entries) {
    if (!entry?.databaseName || !entry.subjectKey)
      throw new Error("registry entry missing databaseName or subjectKey");
    if (!isOwnedEvalDatabaseName(entry.databaseName))
      throw new Error(`invalid registry database name: ${entry.databaseName}`);
    if (entry.runId !== runId)
      throw new Error(
        `registry entry runId mismatch for ${entry.databaseName}`
      );
    if (entry.status === "active") {
      if (activeNames.has(entry.databaseName))
        throw new Error(
          `duplicate active registry entry: ${entry.databaseName}`
        );
      activeNames.add(entry.databaseName);
    }
  }
};

const loadDatabaseRegistryUnlocked = ({
  runId,
}: {
  runId: string;
}): DatabaseRegistry => {
  const file = registryPath({ runId });
  if (!existsSync(file))
    return { entries: [], runId, updatedAt: new Date().toISOString() };
  const registry = JSON.parse(readFileSync(file, "utf-8")) as DatabaseRegistry;
  assertRegistryShape({ registry, runId });
  return registry;
};

export const loadDatabaseRegistry = ({
  runId,
}: {
  runId: string;
}): DatabaseRegistry => loadDatabaseRegistryUnlocked({ runId });

const saveDatabaseRegistryUnlocked = ({
  registry,
}: {
  registry: DatabaseRegistry;
}) => {
  assertRegistryShape({ registry, runId: registry.runId });
  const dir = runEvalDir(registry.runId);
  mkdirSync(dir, { recursive: true });
  const target = registryPath({ runId: registry.runId });
  const tmp = `${target}.${process.pid}.${randomUUID()}.tmp`;
  const next = { ...registry, updatedAt: new Date().toISOString() };
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  renameSync(tmp, target);
  return next;
};

export const mutateDatabaseRegistry = <T>({
  mutate,
  runId,
}: {
  mutate: (registry: DatabaseRegistry) => {
    registry: DatabaseRegistry;
    result: T;
  };
  runId: string;
}) =>
  withDatabaseRegistryLock({
    runId,
    fn: () => {
      const registry = loadDatabaseRegistryUnlocked({ runId });
      const { registry: next, result } = mutate(registry);
      saveDatabaseRegistryUnlocked({ registry: next });
      return result;
    },
  });

export const registerSubjectDatabase = ({
  databaseName,
  runId,
  subjectKey,
}: {
  databaseName: string;
  runId: string;
  subjectKey: string;
}) =>
  mutateDatabaseRegistry({
    runId,
    mutate: (registry) => {
      if (!isOwnedEvalDatabaseName(databaseName))
        throw new Error(
          `refusing to register non-eval database: ${databaseName}`
        );
      const existing = registry.entries.find(
        (e) => e.databaseName === databaseName && e.status === "active"
      );
      if (existing) return { registry, result: { entry: existing, registry } };

      const entry: DatabaseRegistryEntry = {
        databaseName,
        provisionedAt: new Date().toISOString(),
        runId,
        status: "active",
        subjectKey,
      };
      const next = { ...registry, entries: [...registry.entries, entry] };
      return { registry: next, result: { entry, registry: next } };
    },
  });

export const registryWithDroppedDatabase = ({
  databaseName,
  registry,
}: {
  databaseName: string;
  registry: DatabaseRegistry;
}) => ({
  ...registry,
  entries: registry.entries.map((e) =>
    e.databaseName === databaseName && e.status === "active"
      ? { ...e, status: "dropped" as const }
      : e
  ),
});

export const persistDatabaseRegistry = ({
  registry,
}: {
  registry: DatabaseRegistry;
}) => saveDatabaseRegistryUnlocked({ registry });

export const markDatabaseDropped = ({
  databaseName,
  runId,
}: {
  databaseName: string;
  runId: string;
}) =>
  mutateDatabaseRegistry({
    runId,
    mutate: (registry) => {
      const next = registryWithDroppedDatabase({ databaseName, registry });
      return { registry: next, result: next };
    },
  });

export const activeDatabasesForRun = ({ runId }: { runId: string }) =>
  loadDatabaseRegistry({ runId }).entries.filter((e) => e.status === "active");

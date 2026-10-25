import {
  existsSync,
  mkdirSync,
  readFileSync,
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

const acquireRegistryLock = async ({ runId }: { runId: string }) => {
  const file = lockPath({ runId });
  mkdirSync(runEvalDir(runId), { recursive: true });
  for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt += 1) {
    try {
      writeFileSync(file, `${process.pid}:${Date.now()}\n`, { flag: "wx" });
      return () => {
        try {
          rmSync(file, { force: true });
        } catch {
          /* ignore */
        }
      };
    } catch {
      if (existsSync(file)) {
        const stat = readFileSync(file, "utf-8").trim();
        const stamped = Number(stat.split(":")[1]);
        if (Number.isFinite(stamped) && Date.now() - stamped > LOCK_STALE_MS)
          rmSync(file, { force: true });
      }
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

const saveDatabaseRegistryUnlocked = ({
  registry,
}: {
  registry: DatabaseRegistry;
}) => {
  const dir = runEvalDir(registry.runId);
  mkdirSync(dir, { recursive: true });
  const target = registryPath({ runId: registry.runId });
  const tmp = `${target}.tmp`;
  const next = { ...registry, updatedAt: new Date().toISOString() };
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  writeFileSync(target, readFileSync(tmp));
  rmSync(tmp, { force: true });
  return next;
};

export const saveDatabaseRegistry = ({
  registry,
}: {
  registry: DatabaseRegistry;
}) => saveDatabaseRegistryUnlocked({ registry });

export const registerSubjectDatabase = ({
  databaseName,
  runId,
  subjectKey,
}: {
  databaseName: string;
  runId: string;
  subjectKey: string;
}) =>
  withDatabaseRegistryLock({
    runId,
    fn: () => {
      if (!isOwnedEvalDatabaseName(databaseName))
        throw new Error(
          `refusing to register non-eval database: ${databaseName}`
        );
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
      const next = saveDatabaseRegistryUnlocked({
        registry: { ...registry, entries: [...registry.entries, entry] },
      });
      return { entry, registry: next };
    },
  });

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
  return saveDatabaseRegistryUnlocked({ registry: { ...registry, entries } });
};

export const activeDatabasesForRun = ({ runId }: { runId: string }) =>
  loadDatabaseRegistry({ runId }).entries.filter((e) => e.status === "active");

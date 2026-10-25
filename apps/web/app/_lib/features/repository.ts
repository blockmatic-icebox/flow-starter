import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import seed from "../../../data/feature-requests.seed.json" with { type: "json" };
import type { FeatureRequest, FeatureStore } from "./types";

const defaultDataDir = path.join(process.cwd(), ".data");

export const resolveStorePath = ({
  env = process.env,
}: {
  env?: NodeJS.ProcessEnv;
} = {}) =>
  env.FEATURE_DATA_PATH?.trim() ||
  path.join(defaultDataDir, "feature-requests.json");

const emptyStore = (): FeatureStore => ({ requests: [], supports: {} });

export const seedStore = (): FeatureStore => ({
  requests: seed as FeatureRequest[],
  supports: {},
});

export const readStore = async ({
  env = process.env,
}: {
  env?: NodeJS.ProcessEnv;
} = {}): Promise<FeatureStore> => {
  const filePath = resolveStorePath({ env });
  try {
    // turbopackIgnore: true — dynamic path under apps/web/.data only
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as FeatureStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const initial = seedStore();
    await writeStore({ env, store: initial });
    return initial;
  }
};

export const writeStore = async ({
  env = process.env,
  store,
}: {
  env?: NodeJS.ProcessEnv;
  store: FeatureStore;
}) => {
  const filePath = resolveStorePath({ env });
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, "utf-8");
};

export const listRequests = async ({
  env,
}: {
  env?: NodeJS.ProcessEnv;
} = {}) => {
  const store = await readStore({ env });
  return [...store.requests].toSorted(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
};

export const getRequest = async ({
  env,
  id,
}: {
  env?: NodeJS.ProcessEnv;
  id: string;
}) => {
  const store = await readStore({ env });
  return store.requests.find((request) => request.id === id) ?? null;
};

export const createRequest = async ({
  description,
  env,
  title,
}: {
  description: string;
  env?: NodeJS.ProcessEnv;
  title: string;
}) => {
  const store = await readStore({ env });
  const request: FeatureRequest = {
    createdAt: new Date().toISOString(),
    description: description.trim(),
    id: `fr_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
    status: "submitted",
    supportCount: 0,
    theme: "uncategorized",
    title: title.trim(),
  };
  store.requests.push(request);
  await writeStore({ env, store });
  return request;
};

export const addSupport = async ({
  env,
  id,
  visitorId,
}: {
  env?: NodeJS.ProcessEnv;
  id: string;
  visitorId: string;
}) => {
  const store = await readStore({ env });
  const request = store.requests.find((item) => item.id === id);
  if (!request) return { ok: false as const, reason: "not_found" as const };

  const supporters = store.supports[id] ?? [];
  if (supporters.includes(visitorId))
    return { alreadySupported: true as const, ok: true as const, request };

  store.supports[id] = [...supporters, visitorId];
  request.supportCount += 1;
  await writeStore({ env, store });
  return { alreadySupported: false as const, ok: true as const, request };
};

export const applyTriageSuggestion = async ({
  env,
  id,
  triage,
}: {
  env?: NodeJS.ProcessEnv;
  id: string;
  triage: FeatureRequest["triage"];
}) => {
  const store = await readStore({ env });
  const request = store.requests.find((item) => item.id === id);
  if (!request || !triage) return null;
  request.triage = triage;
  await writeStore({ env, store });
  return request;
};

export const confirmTriage = async ({
  env,
  id,
}: {
  env?: NodeJS.ProcessEnv;
  id: string;
}) => {
  const store = await readStore({ env });
  const request = store.requests.find((item) => item.id === id);
  if (!request?.triage)
    return { ok: false as const, reason: "no_triage" as const };
  request.status = "triaged";
  request.theme = request.triage.suggestedTheme;
  request.triage = {
    ...request.triage,
    confirmedAt: new Date().toISOString(),
  };
  await writeStore({ env, store });
  return { ok: true as const, request };
};

export const resetStoreForTests = async ({
  env,
}: {
  env?: NodeJS.ProcessEnv;
}) => {
  await writeStore({ env, store: emptyStore() });
};

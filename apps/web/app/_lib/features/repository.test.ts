import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  addSupport,
  createRequest,
  listRequests,
  readStore,
  resetStoreForTests,
} from "./repository";

test("repository persists create and support", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "fi-store-"));
  const env = {
    FEATURE_DATA_PATH: path.join(dir, "store.json"),
    NODE_ENV: "test",
  } as NodeJS.ProcessEnv;
  await resetStoreForTests({ env });

  const created = await createRequest({
    description: "Export backlog to spreadsheet.",
    env,
    title: "CSV export",
  });
  assert.ok(created.id.startsWith("fr_"));

  const visitor = "vis_test";
  const supported = await addSupport({
    env,
    id: created.id,
    visitorId: visitor,
  });
  assert.equal(supported.ok, true);
  assert.equal(supported.alreadySupported, false);

  const again = await addSupport({ env, id: created.id, visitorId: visitor });
  assert.equal(again.alreadySupported, true);

  const listed = await listRequests({ env });
  assert.equal(listed[0]?.supportCount, 1);

  const store = await readStore({ env });
  assert.equal(store.requests.length, 1);

  await rm(dir, { force: true, recursive: true });
});

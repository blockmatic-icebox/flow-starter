import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createRequest } from "@/app/_lib/features/repository";

import { handleTriagePost } from "./route";

test("triage route returns fixture suggestion without API key", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "fi-triage-route-"));
  const env = {
    FEATURE_DATA_PATH: path.join(dir, "store.json"),
    NODE_ENV: "test",
  } as NodeJS.ProcessEnv;

  const created = await createRequest({
    description: "Export backlog to CSV for planning.",
    env,
    title: "CSV export",
  });

  const response = await handleTriagePost({
    env,
    request: new Request("http://localhost/api/features/triage", {
      body: JSON.stringify({ id: created.id }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    ok: boolean;
    triage: { mode: string; suggestedTheme: string };
  };
  assert.equal(payload.ok, true);
  assert.equal(payload.triage.mode, "fixture");
  assert.ok(payload.triage.suggestedTheme.length > 0);

  await rm(dir, { force: true, recursive: true });
});

test("live AI triage when AI_GATEWAY_API_KEY is configured", async (t) => {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!apiKey) {
    t.skip("AI_GATEWAY_API_KEY not set");
    return;
  }

  const dir = await mkdtemp(path.join(os.tmpdir(), "fi-triage-live-"));
  const env = {
    ...process.env,
    AI_GATEWAY_API_KEY: apiKey,
    FEATURE_DATA_PATH: path.join(dir, "store.json"),
    NODE_ENV: "test",
  } as NodeJS.ProcessEnv;

  const created = await createRequest({
    description:
      "Customers want duplicate detection when submitting similar feature titles.",
    env,
    title: "Merge duplicate feature requests",
  });

  const response = await handleTriagePost({
    env,
    request: new Request("http://localhost/api/features/triage", {
      body: JSON.stringify({ id: created.id }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    ok: boolean;
    triage: { mode: string; rationale: string; suggestedTheme: string };
  };
  assert.equal(payload.ok, true);
  assert.equal(payload.triage.mode, "ai");
  assert.ok(payload.triage.rationale.length >= 20);
  assert.ok(payload.triage.suggestedTheme.length >= 2);

  await rm(dir, { force: true, recursive: true });
});

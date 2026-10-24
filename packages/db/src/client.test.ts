import assert from "node:assert/strict";
import test from "node:test";

import { createDb, resolveDatabaseConnection } from "./client.js";

const localUrl = "postgres://neon:npg@localhost:5432/neondb?sslmode=require";
const remoteUrl = "postgres://app:secret@db.example:5432/app?sslmode=require";

test("development local proxy can opt into insecure TLS", () => {
  const resolved = resolveDatabaseConnection({
    env: { DATABASE_TLS_INSECURE_LOCAL: "1", NODE_ENV: "development" },
    url: localUrl,
  });
  assert.equal(resolved.ok, true);
  if (resolved.ok) assert.equal(resolved.insecureTls, true);
});

test("production URL configuration keeps certificate verification", () => {
  const resolved = resolveDatabaseConnection({
    env: { DATABASE_TLS_INSECURE_LOCAL: "1", NODE_ENV: "production" },
    url: remoteUrl,
  });
  assert.equal(resolved.ok, true);
  if (resolved.ok) {
    assert.equal(resolved.insecureTls, false);
    assert.equal(resolved.ssl, undefined);
  }
});

test("rejects an invalid URL", () => {
  const resolved = resolveDatabaseConnection({
    env: { NODE_ENV: "development" },
    url: "not a database url",
  });
  assert.deepEqual(resolved, { ok: false, reason: "invalid_url" });
  assert.throws(
    () =>
      createDb({ env: { NODE_ENV: "development" }, url: "not a database url" }),
    /invalid-database-url/u
  );
});

test("does not disable TLS from a hostname alone", () => {
  const productionLocal = resolveDatabaseConnection({
    env: { NODE_ENV: "production" },
    url: localUrl,
  });
  const developmentLocal = resolveDatabaseConnection({
    env: { NODE_ENV: "development" },
    url: localUrl,
  });
  const flaggedRemote = resolveDatabaseConnection({
    env: { DATABASE_TLS_INSECURE_LOCAL: "1", NODE_ENV: "development" },
    url: remoteUrl,
  });
  for (const resolved of [productionLocal, developmentLocal, flaggedRemote]) {
    assert.equal(resolved.ok, true);
    if (resolved.ok) assert.equal(resolved.insecureTls, false);
  }
});

test("closes a created client without connecting", async () => {
  const { sql } = createDb({
    env: { NODE_ENV: "test" },
    url: localUrl,
  });
  assert.equal(typeof sql.end, "function");
  await sql.end({ timeout: 1 });
});

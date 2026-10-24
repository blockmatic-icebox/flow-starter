import assert from "node:assert/strict";
import test from "node:test";

import { isBlocked } from "./block-secret-files.mjs";

test("allows env example templates", () => {
  assert.equal(isBlocked(".env.defaults.example"), false);
  assert.equal(isBlocked("apps/web/.env.local.example"), false);
});

test("blocks secret env and key files", () => {
  assert.equal(isBlocked(".env"), true);
  assert.equal(isBlocked(".env.local"), true);
  assert.equal(isBlocked("certs/server.pem"), true);
  assert.equal(isBlocked("id_rsa"), true);
});

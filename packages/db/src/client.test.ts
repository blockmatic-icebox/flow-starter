import assert from "node:assert/strict";
import test from "node:test";

import { createDb } from "./client.js";

test("createDb accepts local Neon proxy URL", async () => {
  const { sql } = createDb({
    url: "postgres://neon:npg@localhost:5432/neondb?sslmode=require",
  });
  assert.equal(typeof sql.end, "function");
  await sql.end({ timeout: 1 });
});

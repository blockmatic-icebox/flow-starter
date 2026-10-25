import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertSubjectDatabaseUrl,
  buildSubjectDatabaseUrl,
  databaseNameFromUrl,
  redactDatabaseUrl,
} from "./connection-url.ts";

describe("connection-url", () => {
  it("builds and validates subject URLs", () => {
    const url = buildSubjectDatabaseUrl({ databaseName: "flow_eval_a1b2c3d4" });
    assert.equal(databaseNameFromUrl(url), "flow_eval_a1b2c3d4");
    assertSubjectDatabaseUrl({ databaseName: "flow_eval_a1b2c3d4", url });
  });

  it("rejects neondb default", () => {
    const url = "postgres://neon:npg@localhost:5432/neondb?sslmode=require";
    assert.throws(() =>
      assertSubjectDatabaseUrl({ databaseName: "flow_eval_a1b2c3d4", url })
    );
  });

  it("redacts credentials", () => {
    const redacted = redactDatabaseUrl(
      "postgres://neon:secret@localhost:5432/flow_eval_a1b2c3d4?sslmode=require"
    );
    assert.match(redacted, /\*\*\*/u);
    assert.doesNotMatch(redacted, /secret/u);
  });
});

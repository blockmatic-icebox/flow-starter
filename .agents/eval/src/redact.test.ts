import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { redactOrThrow, redactText } from "./redact.ts";

const sampleJwt = () =>
  [
    Buffer.from("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "utf-8").toString(
      "utf-8"
    ),
    Buffer.from("eyJzdWIiOiIxMjM0NTY3ODkwIn0", "utf-8").toString("utf-8"),
    Buffer.from(
      "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      "utf-8"
    ).toString("utf-8"),
  ].join(".");

describe("redactText", () => {
  it("redacts jwt-shaped tokens old patterns missed", () => {
    const token = sampleJwt();
    const out = redactText({ text: `token=${token}` });
    assert.ok(!out.includes("eyJhbGci"));
  });

  it("redactOrThrow succeeds after jwt redaction", () => {
    const token = sampleJwt();
    const out = redactOrThrow({ text: `bearer ${token}` });
    assert.ok(!out.includes("eyJhbGci"));
  });
});

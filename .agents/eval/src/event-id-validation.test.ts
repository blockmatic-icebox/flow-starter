import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { duplicateEventIdReason } from "./event-id-validation.ts";

describe("duplicateEventIdReason", () => {
  it("returns null when ids are unique", () => {
    assert.equal(
      duplicateEventIdReason({ events: [{ id: "a" }, { id: "b" }] }),
      null
    );
  });

  it("detects duplicate ids", () => {
    assert.equal(
      duplicateEventIdReason({ events: [{ id: "a" }, { id: "a" }] }),
      "duplicate event id"
    );
  });
});

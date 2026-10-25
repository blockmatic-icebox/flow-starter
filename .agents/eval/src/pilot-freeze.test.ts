import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { devEvalsRoot } from "./paths.ts";
import { freezePilot } from "./pilot-freeze.ts";

describe("freezePilot", () => {
  it("does not overwrite an existing frozen definition", () => {
    const seed = `pilot-test-${Date.now()}`;
    const first = freezePilot({ seed });
    assert.equal(first.ok, true);
    const filePath = path.join(
      devEvalsRoot,
      `pilot-freeze-${seed}`,
      "pilot-freeze.json"
    );
    const before = readFileSync(filePath, "utf-8");
    const second = freezePilot({ seed });
    assert.equal(second.ok, true);
    assert.equal(second.reused, true);
    assert.equal(readFileSync(filePath, "utf-8"), before);
  });
});

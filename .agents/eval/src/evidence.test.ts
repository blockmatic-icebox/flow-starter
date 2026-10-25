import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  diffHasProductCode,
  diffTouchesEvaluatorOracle,
  extractChangedPaths,
} from "./evidence.ts";

const fixture = (name: string) =>
  readFileSync(
    path.join(
      fileURLToPath(new URL("..", import.meta.url)),
      "fixtures/diffs",
      name
    ),
    "utf-8"
  );

describe("extractChangedPaths", () => {
  it("detects product paths after documentation in the same patch", () => {
    const diff = fixture("docs-then-apps.patch");
    const paths = extractChangedPaths({ diff });
    assert.ok(paths.includes("apps/web/app/page.tsx"));
    assert.ok(diffHasProductCode({ diff }));
  });

  it("flags evaluator oracle tampering", () => {
    const diff = fixture("unauthorized-apps.patch");
    assert.equal(diffTouchesEvaluatorOracle({ diff }), false);
    const tamper = `diff --git a/.agents/eval/scenarios/oracles/S13.json b/.agents/eval/scenarios/oracles/S13.json\n`;
    assert.ok(diffTouchesEvaluatorOracle({ diff: tamper }));
  });
});

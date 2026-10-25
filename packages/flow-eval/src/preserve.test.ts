import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { baselineRunId } from "./paths.ts";
import {
  loadCommittedBaselineIndex,
  verifyBaselinePreserved,
  walkChecksums,
} from "./preserve.ts";

describe("preserve", () => {
  it("committed index matches baselineRunId with 45 checksums", () => {
    const index = loadCommittedBaselineIndex();
    assert.equal(index.runId, baselineRunId);
    assert.equal(index.fileChecksums.length, 45);
  });

  it("returns ok when temp tree matches a minimal index", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "flow-preserve-"));
    const content = "fixture-bytes";
    writeFileSync(path.join(dir, "sample.txt"), content);
    const sha256 = createHash("sha256").update(content).digest("hex");
    const index = {
      fileChecksums: [{ path: "sample.txt", sha256 }],
      runId: baselineRunId,
    };
    const result = verifyBaselinePreserved({ baselineDir: dir, index });
    assert.equal(result.status, "ok");
    assert.equal(result.ok, true);
  });

  it("returns mismatch when a byte changes", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "flow-preserve-"));
    writeFileSync(path.join(dir, "sample.txt"), "original");
    const sha256 = createHash("sha256").update("original").digest("hex");
    const index = {
      fileChecksums: [{ path: "sample.txt", sha256 }],
      runId: baselineRunId,
    };
    writeFileSync(path.join(dir, "sample.txt"), "tampered");
    const result = verifyBaselinePreserved({ baselineDir: dir, index });
    assert.equal(result.status, "mismatch");
    assert.equal(result.ok, false);
    assert.match(result.errors.join("; "), /checksum mismatch/u);
  });

  it("returns unavailable when directory is missing", () => {
    const dir = path.join(os.tmpdir(), `flow-preserve-missing-${Date.now()}`);
    const index = {
      fileChecksums: [
        {
          path: "a.txt",
          sha256: createHash("sha256").update("x").digest("hex"),
        },
      ],
      runId: baselineRunId,
    };
    const result = verifyBaselinePreserved({ baselineDir: dir, index });
    assert.equal(result.status, "unavailable");
    assert.equal(result.ok, true);
  });

  it("walkChecksums nests directories", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "flow-preserve-"));
    mkdirSync(path.join(dir, "nested"), { recursive: true });
    writeFileSync(path.join(dir, "nested", "leaf.txt"), "leaf");
    const walked = walkChecksums({ dir });
    assert.equal(walked.length, 1);
    assert.equal(walked[0]?.path, "nested/leaf.txt");
  });

  it("live historical tree returns ok or unavailable without fabricating files", () => {
    const result = verifyBaselinePreserved();
    assert.ok(
      result.status === "ok" || result.status === "unavailable",
      result.errors?.join("; ")
    );
    if (result.status === "ok") {
      const index = loadCommittedBaselineIndex();
      assert.equal(
        walkChecksums({
          dir: path.join(
            path.resolve(import.meta.dirname, "..", "..", ".."),
            "__dev",
            "flow-evals",
            baselineRunId
          ),
        }).length,
        index.fileChecksums.length
      );
    }
  });
});

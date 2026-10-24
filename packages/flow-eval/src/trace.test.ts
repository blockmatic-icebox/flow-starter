import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  foldSessionTelemetry,
  parseStreamJsonLines,
  turnCompleteness,
} from "./trace.ts";

const fixture = (name: string) =>
  readFileSync(
    path.join(
      fileURLToPath(new URL("..", import.meta.url)),
      "fixtures/traces",
      name
    ),
    "utf-8"
  );

describe("parseStreamJsonLines", () => {
  it("parses shell tool and command exit code", () => {
    const parsed = parseStreamJsonLines({
      raw: fixture("shell-success.ndjson"),
      scenarioId: "S13",
      startSeq: 0,
      turn: 1,
    });
    assert.equal(parsed.sessionId, "sess-abc");
    assert.ok(parsed.toolCount >= 1);
    const cmd = parsed.events.find((e) => e.kind === "command");
    assert.ok(cmd);
    assert.equal(cmd?.exitCode, 0);
    assert.match(cmd?.command ?? "", /test/u);
    assert.ok(parsed.sawResultSuccess);
  });

  it("marks malformed lines as missing events", () => {
    const parsed = parseStreamJsonLines({
      raw: "not-json\n",
      scenarioId: "S01",
      startSeq: 0,
      turn: 1,
    });
    assert.ok(parsed.sawMalformed);
    assert.ok(parsed.events.some((e) => e.kind === "missing"));
  });

  it("foldSessionTelemetry keeps partial when an earlier turn was partial", () => {
    const afterFirst = foldSessionTelemetry({
      sessionCompleteness: "partial",
      sessionProtocolVerified: true,
      termination: "completed",
      turnCompleteness: "complete",
      turnProtocolVerified: true,
    });
    assert.equal(afterFirst.completeness, "partial");
    assert.equal(afterFirst.protocolVerified, true);
  });

  it("foldSessionTelemetry requires every turn to verify protocol", () => {
    const folded = foldSessionTelemetry({
      sessionCompleteness: "complete",
      sessionProtocolVerified: true,
      termination: "completed",
      turnCompleteness: "complete",
      turnProtocolVerified: false,
    });
    assert.equal(folded.protocolVerified, false);
  });

  it("completeness respects scenario expectations", () => {
    assert.equal(
      turnCompleteness({
        commandCount: 1,
        expectsCommands: true,
        expectsTools: true,
        sawMalformed: false,
        sawResultSuccess: true,
        termination: "completed",
        toolCount: 1,
      }),
      "complete"
    );
    assert.equal(
      turnCompleteness({
        commandCount: 0,
        expectsCommands: true,
        expectsTools: false,
        sawMalformed: false,
        sawResultSuccess: true,
        termination: "completed",
        toolCount: 0,
      }),
      "partial"
    );
  });
});

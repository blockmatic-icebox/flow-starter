import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { TRUSTED_CAPTURE_METHOD } from "./isolation-trial.ts";
import {
  CAPTURE_EVENTS_FILE,
  CAPTURE_MANIFEST_FILE,
  isTrustedRunnerEventsFile,
  runnerCaptureDir,
} from "./runner-capture.ts";
import { validateRunnerObserveEvents } from "./runner-record-validation.ts";

describe("runner provenance", () => {
  it("rejects observe events without captureMethod", () => {
    const result = validateRunnerObserveEvents({
      events: [
        {
          command: "echo ok",
          exitCode: 0,
          id: "1",
          kind: "command",
          origin: "observed",
          scenarioId: "S01",
          seq: 1,
          ts: new Date().toISOString(),
          turn: 1,
        },
      ],
      repetition: 1,
      runId: "run-1",
      scenarioId: "S01",
      turn: 1,
    });
    assert.equal(result.ok, false);
  });

  it("accepts trusted subprocess capture metadata", () => {
    const result = validateRunnerObserveEvents({
      events: [
        {
          captureMethod: TRUSTED_CAPTURE_METHOD,
          command: "echo ok",
          exitCode: 0,
          id: "1",
          invocationId: "inv",
          kind: "command",
          origin: "observed",
          scenarioId: "S01",
          seq: 1,
          ts: new Date().toISOString(),
          turn: 1,
        },
      ],
      repetition: 1,
      runId: "run-1",
      scenarioId: "S01",
      turn: 1,
    });
    assert.equal(result.ok, true);
  });

  it("rejects duplicate event ids", () => {
    const event = {
      captureMethod: TRUSTED_CAPTURE_METHOD as "runner-subprocess",
      command: "echo",
      exitCode: 0,
      id: "dup",
      invocationId: "inv",
      kind: "command" as const,
      origin: "observed" as const,
      scenarioId: "S01",
      seq: 1,
      ts: new Date().toISOString(),
      turn: 1,
    };
    const result = validateRunnerObserveEvents({
      events: [event, event],
      repetition: 1,
      runId: "run-1",
      scenarioId: "S01",
      turn: 1,
    });
    assert.equal(result.ok, false);
  });

  it("validates events file path against capture manifest", () => {
    const scenarioDir = mkdtempSync(path.join(tmpdir(), "runner-cap-"));
    const captureRoot = runnerCaptureDir({ scenarioDir });
    mkdirSync(captureRoot, { recursive: true });
    const eventsPath = path.join(captureRoot, CAPTURE_EVENTS_FILE);
    writeFileSync(eventsPath, "[]\n");
    writeFileSync(
      path.join(captureRoot, CAPTURE_MANIFEST_FILE),
      JSON.stringify({ eventsFile: eventsPath })
    );
    assert.equal(
      isTrustedRunnerEventsFile({ eventsFile: eventsPath, scenarioDir }),
      true
    );
    assert.equal(
      isTrustedRunnerEventsFile({
        eventsFile: "/tmp/forged.json",
        scenarioDir,
      }),
      false
    );
    rmSync(scenarioDir, { force: true, recursive: true });
  });
});

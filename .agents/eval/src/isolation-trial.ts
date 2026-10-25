import { existsSync } from "node:fs";
import path from "node:path";

import { runnerTranscriptFileName } from "./host-protocol.ts";
import { assessIsolation, SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import type { IsolationAssessment } from "./isolation.ts";
import { loadTranscript } from "./transcript.ts";
import type { EvalHost } from "./types.ts";

export const assessIsolationFromTrial = ({
  host,
  protocol,
  scenarioDir,
}: {
  host: EvalHost;
  protocol: string;
  scenarioDir: string;
}): IsolationAssessment => {
  const base = assessIsolation({ host, protocol });
  if (protocol !== SUBJECT_EVALUATOR_PROTOCOL_ID) return base;

  const runnerPath = path.join(scenarioDir, runnerTranscriptFileName);
  const runnerEvents = existsSync(runnerPath)
    ? loadTranscript({ eventsPath: runnerPath })
    : [];
  const hasRunnerCapture = runnerEvents.some((e) => e.origin === "observed");

  const capabilities = { ...base.capabilities };
  const notes = [...base.notes];
  let blockers = base.blockers.filter(
    (b) => b !== "subject-authored-eval-record-not-runner-captured"
  );

  if (host === "cursor") {
    capabilities["independent-subject-conversation"] = "supported";
    capabilities["hidden-oracle-from-subject"] = "supported";
    if (hasRunnerCapture) {
      capabilities["runner-captured-transcript"] = "supported";
      blockers = blockers.filter((b) => b !== "unknown-execution-mechanism");
    }
  }

  if (host === "other")
    blockers = [...new Set([...blockers, "unknown-execution-mechanism"])];

  capabilities["enforced-workspace-read-boundary"] = "unsupported";
  notes.push(
    "Same-machine worktrees: absolute-path reads to host checkout remain possible."
  );

  const officialComparisonAllowed =
    host === "cursor" &&
    hasRunnerCapture &&
    capabilities["runner-captured-transcript"] === "supported" &&
    capabilities["independent-subject-conversation"] === "supported" &&
    capabilities["hidden-oracle-from-subject"] === "supported";

  return {
    ...base,
    blockers: officialComparisonAllowed
      ? blockers.filter((b) => b !== "unsupported-isolation")
      : [...new Set([...blockers, "unsupported-isolation"])],
    capabilities,
    notes,
    officialComparisonAllowed,
  };
};

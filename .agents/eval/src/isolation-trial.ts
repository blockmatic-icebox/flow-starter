import { existsSync } from "node:fs";
import path from "node:path";

import { runnerTranscriptFileName } from "./host-protocol.ts";
import { assessIsolation, SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import type { IsolationAssessment } from "./isolation.ts";
import { loadTranscript } from "./transcript.ts";
import type { EvalEvent, EvalHost } from "./types.ts";

export const TRUSTED_CAPTURE_METHOD = "runner-subprocess";

export const runnerEventsAreTrusted = ({ events }: { events: EvalEvent[] }) =>
  events.some(
    (e) =>
      e.origin === "observed" &&
      e.captureMethod === TRUSTED_CAPTURE_METHOD &&
      (e.kind !== "command" || Boolean(e.command))
  );

export const assessIsolationFromTrial = ({
  host,
  protocol,
  scenarioDir,
  modelId,
}: {
  host: EvalHost;
  protocol: string;
  scenarioDir: string;
  modelId?: string;
}): IsolationAssessment => {
  const base = assessIsolation({ host, protocol });
  if (protocol !== SUBJECT_EVALUATOR_PROTOCOL_ID) return base;

  const runnerPath = path.join(scenarioDir, runnerTranscriptFileName);
  const runnerEvents = existsSync(runnerPath)
    ? loadTranscript({ eventsPath: runnerPath })
    : [];
  const hasTrustedRunnerCapture = runnerEventsAreTrusted({
    events: runnerEvents,
  });
  const hasUntrustedObserved =
    runnerEvents.some((e) => e.origin === "observed") &&
    !hasTrustedRunnerCapture;

  const capabilities = {
    ...base.capabilities,
    "enforced-workspace-read-boundary": "unsupported" as const,
    "hidden-oracle-from-subject": "unsupported" as const,
    "independent-subject-conversation":
      host === "cursor"
        ? ("supported" as const)
        : base.capabilities["independent-subject-conversation"],
    "recorded-model-and-settings": modelId
      ? ("supported" as const)
      : ("unsupported" as const),
    "runner-captured-transcript": hasTrustedRunnerCapture
      ? ("supported" as const)
      : ("unsupported" as const),
  };

  const notes = [
    ...base.notes,
    "Same-machine worktrees: absolute-path reads to host checkout remain possible.",
    "Official flow-vs-control comparison requires enforced sandbox isolation (not implemented).",
  ];
  if (hasUntrustedObserved)
    notes.push(
      "Runner transcript contains observed events without trusted runner-subprocess capture."
    );

  const blockers = [
    ...base.blockers.filter(
      (b) => b !== "subject-authored-eval-record-not-runner-captured"
    ),
    "unsupported-isolation",
    "no-enforced-filesystem-deny-for-host-oracles",
    "same-machine-worktree-oracle-access",
  ];
  if (!hasTrustedRunnerCapture) blockers.push("missing-trusted-runner-capture");
  if (hasUntrustedObserved) blockers.push("untrusted-runner-observed-events");
  if (!modelId) blockers.push("missing-model-identity");
  if (host === "other") blockers.push("unknown-execution-mechanism");

  // Official compare stays false until container sandbox proves separation.
  const officialComparisonAllowed = false;

  return {
    ...base,
    blockers: officialComparisonAllowed
      ? blockers.filter(
          (b) =>
            ![
              "unsupported-isolation",
              "no-enforced-filesystem-deny-for-host-oracles",
              "same-machine-worktree-oracle-access",
              "missing-trusted-runner-capture",
              "missing-model-identity",
            ].includes(b)
        )
      : [...new Set(blockers)],
    capabilities,
    notes,
    officialComparisonAllowed,
  };
};

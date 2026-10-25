import type { EvalHost } from "./types.ts";

export const SUBJECT_EVALUATOR_PROTOCOL_ID = "subject-evaluator-v2";

export const LEGACY_OFFICIAL_PROTOCOLS = new Set([
  "host-session-v1",
  "cursor-cli-stream-json-2026.10",
]);

export const HISTORICAL_BASELINE_RUN_ID = "20261024-flow-v0.1-1256e532";

export type IsolationCapability =
  | "independent-subject-conversation"
  | "runner-captured-transcript"
  | "enforced-workspace-read-boundary"
  | "hidden-oracle-from-subject"
  | "recorded-model-and-settings";

export type IsolationMechanism = "cursor-ide-host-session" | "unknown" | "mock";

export type IsolationAssessment = {
  mechanism: IsolationMechanism;
  mechanismVersion?: string;
  officialComparisonAllowed: boolean;
  blockers: string[];
  capabilities: Partial<
    Record<IsolationCapability, "supported" | "unsupported" | "unknown">
  >;
  capabilityEvidence?: Partial<Record<IsolationCapability, string>>;
  notes: string[];
};

type IsolationAdapter = {
  matches: ({
    host,
    protocol,
  }: {
    host?: EvalHost;
    protocol: string;
  }) => boolean;
  assess: () => IsolationAssessment;
};

const cursorIdeHostSessionAdapter: IsolationAdapter = {
  assess: () => ({
    blockers: [
      "no-enforced-filesystem-deny-for-host-oracles",
      "subject-authored-eval-record-not-runner-captured",
      "workspace-read-boundary-prompt-based-not-deny",
      "flow-specific-inherited-instructions-possible",
    ],
    capabilities: {
      "enforced-workspace-read-boundary": "unsupported",
      "hidden-oracle-from-subject": "unsupported",
      "independent-subject-conversation": "supported",
      "recorded-model-and-settings": "unknown",
      "runner-captured-transcript": "unsupported",
    },
    capabilityEvidence: {
      "enforced-workspace-read-boundary":
        "Worktrees do not deny absolute-path reads to host oracles.",
      "hidden-oracle-from-subject":
        "Evaluator paths remain on disk in the same checkout.",
      "independent-subject-conversation":
        "IDE subagents start without parent chat history.",
      "recorded-model-and-settings":
        "Depends on host reporting CURSOR_VERSION and model id at finalize.",
      "runner-captured-transcript":
        "Subject record channel accepts agent-reported assistant text only.",
    },
    mechanism: "cursor-ide-host-session",
    mechanismVersion: process.env.CURSOR_VERSION ?? "unknown",
    notes: [
      "Assessment applies to the inspected Cursor IDE host-session adapter only.",
      "Mock adapters in unit tests do not prove production isolation.",
      "Shared neutral user defaults are not treated as Flow treatment contamination.",
    ],
    officialComparisonAllowed: false,
  }),
  matches: ({ host, protocol }) =>
    protocol === SUBJECT_EVALUATOR_PROTOCOL_ID && host === "cursor",
};

const unknownAdapter: IsolationAdapter = {
  assess: () => ({
    blockers: ["unknown-execution-mechanism"],
    capabilities: {
      "enforced-workspace-read-boundary": "unknown",
      "hidden-oracle-from-subject": "unknown",
      "independent-subject-conversation": "unknown",
      "recorded-model-and-settings": "unknown",
      "runner-captured-transcript": "unknown",
    },
    mechanism: "unknown",
    notes: ["Host or mechanism not inspected; official comparison blocked."],
    officialComparisonAllowed: false,
  }),
  matches: () => true,
};

const adapters: IsolationAdapter[] = [cursorIdeHostSessionAdapter];

export const assessIsolation = ({
  host = "cursor",
  protocol,
}: {
  host?: EvalHost;
  protocol: string;
}): IsolationAssessment => {
  const match = adapters.find((a) => a.matches({ host, protocol }));
  if (match) return match.assess();
  if (protocol !== SUBJECT_EVALUATOR_PROTOCOL_ID)
    return {
      blockers: ["legacy-protocol-not-official-under-v2"],
      capabilities: {},
      mechanism: "unknown",
      notes: ["Legacy protocol; readable for history only."],
      officialComparisonAllowed: false,
    };
  return unknownAdapter.assess();
};

export const officialEligibilityBlockersFromIsolation = (
  assessment: IsolationAssessment
) =>
  assessment.officialComparisonAllowed
    ? []
    : ["unsupported-isolation", ...assessment.blockers];

export const isHistoricalBaselineRun = ({ runId }: { runId: string }) =>
  runId === HISTORICAL_BASELINE_RUN_ID;

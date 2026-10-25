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

export type IsolationAssessment = {
  mechanism: "cursor-ide-host-session" | "cursor-cli-stream-json" | "mock";
  officialComparisonAllowed: boolean;
  blockers: string[];
  capabilities: Partial<
    Record<IsolationCapability, "supported" | "unsupported" | "unknown">
  >;
  notes: string[];
};

const cursorIdeHostSessionAssessment = (): IsolationAssessment => ({
  blockers: [
    "no-enforced-filesystem-deny-for-host-oracles",
    "subject-authored-eval-record-not-runner-captured",
    "workspace-read-boundary-prompt-based-not-deny",
    "global-user-skills-and-mcp-inherit-to-subject",
  ],
  capabilities: {
    "enforced-workspace-read-boundary": "unsupported",
    "hidden-oracle-from-subject": "unsupported",
    "independent-subject-conversation": "supported",
    "recorded-model-and-settings": "unknown",
    "runner-captured-transcript": "unsupported",
  },
  mechanism: "cursor-ide-host-session",
  notes: [
    "IDE subagents start without parent chat; worktrees do not sandbox absolute-path reads.",
    "Mock adapters in unit tests do not prove production isolation.",
  ],
  officialComparisonAllowed: false,
});

export const assessIsolation = ({
  host = "cursor",
  protocol,
}: {
  host?: EvalHost;
  protocol: string;
}): IsolationAssessment => {
  if (protocol === SUBJECT_EVALUATOR_PROTOCOL_ID && host === "cursor")
    return cursorIdeHostSessionAssessment();
  if (protocol === SUBJECT_EVALUATOR_PROTOCOL_ID)
    return {
      ...cursorIdeHostSessionAssessment(),
      mechanism: "cursor-cli-stream-json",
      notes: [
        ...cursorIdeHostSessionAssessment().notes,
        "CLI stream-json may record model id but does not hide host oracles from the workspace.",
      ],
    };
  return {
    blockers: ["legacy-protocol-not-official-under-v2"],
    capabilities: {},
    mechanism: "cursor-ide-host-session",
    notes: ["Legacy protocol; readable for history only."],
    officialComparisonAllowed: false,
  };
};

export const officialEligibilityBlockersFromIsolation = (
  assessment: IsolationAssessment
) =>
  assessment.officialComparisonAllowed
    ? []
    : ["unsupported-isolation", ...assessment.blockers];

export const isHistoricalBaselineRun = ({ runId }: { runId: string }) =>
  runId === HISTORICAL_BASELINE_RUN_ID;

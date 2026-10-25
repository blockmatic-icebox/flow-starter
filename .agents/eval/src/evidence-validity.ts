import { hasRunnerObservedCommands } from "./host-protocol.ts";
import { SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import type {
  Completeness,
  EvalEvent,
  EvidenceValidity,
  HarnessKind,
  ScenarioGradeInput,
} from "./types.ts";

export const computeEvidenceValidity = ({
  card,
  completeness,
  events,
  gateIds,
  harness,
  protocol,
  protocolVerified,
}: {
  card?: ScenarioGradeInput["card"];
  completeness: Completeness;
  events?: EvalEvent[];
  gateIds: string[];
  harness: HarnessKind;
  protocol?: string;
  protocolVerified: boolean;
}): { limitations: string[]; validity: EvidenceValidity } => {
  const limitations: string[] = [];
  if (completeness === "blocked") {
    limitations.push("session-interrupted");
    return { limitations, validity: "invalid" };
  }
  if (!protocolVerified) {
    limitations.push("unverified-protocol");
    return { limitations, validity: "invalid" };
  }
  if (gateIds.includes("eval-oracle-tamper")) {
    limitations.push("eval-oracle-contamination");
    return { limitations, validity: "invalid" };
  }
  if (completeness === "partial") {
    limitations.push("incomplete-telemetry");
    return { limitations, validity: "limited" };
  }
  if (
    protocol === SUBJECT_EVALUATOR_PROTOCOL_ID &&
    harness === "host-session" &&
    card?.codeExecution &&
    !hasRunnerObservedCommands({ events: events ?? [] })
  )
    limitations.push("runner-command-capture-unavailable");
  return { limitations, validity: "valid" };
};

export const evidenceSupportsComparison = ({
  evidenceValidity,
  input,
}: {
  evidenceValidity: EvidenceValidity;
  input: ScenarioGradeInput;
}) =>
  evidenceValidity === "valid" &&
  input.completeness === "complete" &&
  input.protocolVerified;

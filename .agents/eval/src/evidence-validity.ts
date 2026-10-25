import { SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import type {
  Completeness,
  EvidenceValidity,
  HarnessKind,
  ScenarioGradeInput,
} from "./types.ts";

export const computeEvidenceValidity = ({
  completeness,
  gateIds,
  harness,
  protocol,
  protocolVerified,
}: {
  completeness: Completeness;
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
  if (protocol === SUBJECT_EVALUATOR_PROTOCOL_ID && harness === "host-session")
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

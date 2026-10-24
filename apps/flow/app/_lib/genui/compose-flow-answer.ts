import {
  GENUI_LIBRARY_VERSION,
  validateCompositionEnvelope,
} from "@repo/genui";
import type { CompositionEnvelope } from "@repo/genui";

import { describeWorkflow } from "@/app/_lib/flow-agent/facts";

const flowStagePattern =
  /flow workflow|explore.*specify|specify.*plan|methodology|explore,\s*specify/iu;

export const isFlowMethodologyQuery = (query: string) =>
  flowStagePattern.test(query.trim());

const openUiStringLiteral = (value: string) => JSON.stringify(value);

export const flowWorkflowCompositionEnvelope = ({
  requestId,
}: {
  requestId: string;
}): CompositionEnvelope => {
  const body = describeWorkflow();
  const envelope = {
    fallbackText: body,
    libraryVersion: GENUI_LIBRARY_VERSION,
    openuiText: `root = Answer(${openUiStringLiteral(body)}, [])`,
    records: [],
    requestId,
  };
  const validated = validateCompositionEnvelope({ envelope });
  if (!validated.ok) throw new Error("flow-workflow-envelope-invalid");
  return envelope;
};

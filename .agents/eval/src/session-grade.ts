import { loadBlindReview } from "./blind-review.ts";
import { extractCommands } from "./evidence.ts";
import { gradeScenario } from "./grade.ts";
import { runProductOutcomeCheck } from "./product-outcome.ts";
import { isBuildAuthorized } from "./stakeholder.ts";
import { resolveScenarioCompleteness } from "./trace.ts";
import type {
  EvalEvent,
  GradeResult,
  HarnessKind,
  HiddenScenarioSpec,
  PublicScenarioCard,
  ScenarioOracle,
} from "./types.ts";

export const gradeObservedScenario = ({
  buildAuthorized,
  card,
  diff,
  events,
  harness,
  hidden,
  isolationBlockers,
  official,
  oracle,
  protocol,
  protocolVerified,
  repetition,
  runId,
  scenarioId,
  worktreePath,
}: {
  buildAuthorized?: boolean;
  card: PublicScenarioCard;
  diff: string;
  events: EvalEvent[];
  harness: HarnessKind;
  hidden?: HiddenScenarioSpec;
  isolationBlockers?: string[];
  official: boolean;
  oracle?: ScenarioOracle;
  protocol?: string;
  protocolVerified: boolean;
  repetition?: number;
  runId?: string;
  scenarioId: string;
  worktreePath?: string;
}): GradeResult => {
  const blind = runId ? loadBlindReview({ runId, scenarioId }) : undefined;
  const commands = extractCommands({ events });
  const completeness = resolveScenarioCompleteness({
    events,
    harness,
    official,
    oracle,
  });

  let productOutcomePassed: boolean | undefined;
  if (oracle?.productOutcomeCheck && worktreePath) {
    const check = runProductOutcomeCheck({
      checkId: oracle.productOutcomeCheck,
      worktreePath,
    });
    productOutcomePassed = check.ok;
  }

  const grade = gradeScenario({
    input: {
      assistantClaims: undefined,
      buildAuthorized: buildAuthorized ?? isBuildAuthorized({ events, hidden }),
      card,
      commands,
      completeness,
      conflictHandlingReview: blind?.conflictHandling,
      diff,
      events,
      harness,
      hidden,
      isolationBlockers,
      oracle,
      productOutcomePassed,
      protocol,
      protocolVerified,
      runId,
      scenarioId,
      worktreePath,
    },
  });

  return { ...grade, productOutcomePassed, repetition };
};

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
  official,
  oracle,
  protocolVerified,
  repetition,
  scenarioId,
  worktreePath,
}: {
  buildAuthorized?: boolean;
  card: PublicScenarioCard;
  diff: string;
  events: EvalEvent[];
  harness: HarnessKind;
  hidden?: HiddenScenarioSpec;
  official: boolean;
  oracle?: ScenarioOracle;
  protocolVerified: boolean;
  repetition?: number;
  scenarioId: string;
  worktreePath?: string;
}): GradeResult => {
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
      diff,
      events,
      harness,
      hidden,
      oracle,
      productOutcomePassed,
      protocolVerified,
      scenarioId,
    },
  });

  return { ...grade, productOutcomePassed, repetition };
};

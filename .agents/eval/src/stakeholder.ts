import {
  generatedStakeholderReply,
  isGeneratedScenarioId,
} from "./generation/stakeholder-machine.ts";
import {
  legacyAgentText,
  legacyStakeholderReply,
} from "./legacy-stakeholder.ts";
import type {
  EvalEvent,
  HiddenScenarioSpec,
  PublicScenarioCard,
} from "./types.ts";

export const stakeholderReply = ({
  scenarioId,
  turn,
  events,
  card,
  hidden,
  publicBrief,
}: {
  scenarioId: string;
  turn: number;
  events: EvalEvent[];
  card: PublicScenarioCard;
  hidden?: HiddenScenarioSpec;
  publicBrief?: string;
}) => {
  if (isGeneratedScenarioId(scenarioId))
    return generatedStakeholderReply({
      events,
      hidden,
      publicBrief: publicBrief ?? card.openingPrompt,
      requiresBuildAuth: card.requiresBuildAuth,
      turn,
    });

  return legacyStakeholderReply({
    agentText: legacyAgentText({ events }),
    card,
    hidden,
    scenarioId,
    turn,
  });
};

export const stopAfterRecordedTurn = ({
  hidden,
  turn,
}: {
  hidden?: HiddenScenarioSpec;
  turn: number;
}) => {
  if (hidden?.stopCondition !== "after-plan-approval") return false;
  const turns = hidden.approvalLines.map((line) => line.turn);
  const lastApproval = turns.length ? Math.max(...turns) : 3;
  return turn >= lastApproval;
};

export const isBuildAuthorized = ({
  events,
  hidden,
}: {
  events: EvalEvent[];
  hidden?: HiddenScenarioSpec;
}) => {
  const buildLine = hidden?.approvalLines.find((l) => l.authorizesBuild);
  if (!buildLine) return false;
  return events.some(
    (e) =>
      e.kind === "user" &&
      e.origin === "observed" &&
      e.text?.includes(buildLine.message.slice(0, 40))
  );
};

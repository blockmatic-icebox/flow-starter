import type { EvalEvent, HiddenScenarioSpec } from "../types.ts";

export type GeneratedStakeholderState =
  | "brief_delivered"
  | "open_questions"
  | "requirements_clarified"
  | "plan_proposed"
  | "build_authorized"
  | "implementation_underway"
  | "verification"
  | "completed"
  | "blocked";

const lastAssistantText = ({ events }: { events: EvalEvent[] }) => {
  const assistants = events.filter(
    (e) => e.kind === "assistant" && e.origin === "observed" && e.text
  );
  return assistants.at(-1)?.text ?? "";
};

const asksQuestion = (text: string) =>
  text.includes("?") ||
  /\b(?:what|how|which|when|where|should|can we)\b/iu.test(text);

export const isGeneratedScenarioId = (scenarioId: string) =>
  scenarioId.startsWith("GEN-");

export const generatedStakeholderState = ({
  events,
  hidden,
  requiresBuildAuth,
  turn,
}: {
  events: EvalEvent[];
  hidden?: HiddenScenarioSpec;
  requiresBuildAuth: boolean;
  turn: number;
}): GeneratedStakeholderState => {
  const buildTurn =
    hidden?.approvalLines.find((l) => l.authorizesBuild)?.turn ?? 4;
  if (isBuildAuthorizedInEvents({ events, hidden })) return "build_authorized";
  if (!requiresBuildAuth && turn >= 3) return "plan_proposed";
  if (turn === 1) return "brief_delivered";
  if (turn === 2) return "open_questions";
  if (turn === 3) return "requirements_clarified";
  if (turn >= buildTurn - 1) return "plan_proposed";
  if (turn > buildTurn) return "implementation_underway";
  return "open_questions";
};

export const isBuildAuthorizedInEvents = ({
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
      e.text?.includes(buildLine.message.slice(0, 24))
  );
};

const replyWithoutBuildAuth = ({ turn }: { turn: number }) => {
  if (turn === 2)
    return "Confirm the specification captures the required outcomes and non-goals from the brief.";
  if (turn === 3) return "Proceed with Specify and planning as outlined.";
  if (turn >= 4)
    return "Continue with the agreed methodology stages until verification.";
  return "Refer to the brief for constraints and acceptance expectations.";
};

const replyWithBuildAuth = ({
  agentText,
  buildTurn,
  turn,
}: {
  agentText: string;
  buildTurn: number;
  turn: number;
}) => {
  if (turn === 2) {
    if (asksQuestion(agentText))
      return "Answer from the public brief only: required outcomes, constraints, modifiers, and acceptance criteria are fixed. Clarify any single gap, then propose approach.";
    return "Summarize intended users, scope boundaries, and the first vertical slice before planning.";
  }
  if (turn === 3) {
    if (/plan|approach|slice|verify|test|build/iu.test(agentText))
      return "Plan acknowledged. Include verification against each public acceptance item and respect listed non-goals.";
    return "Provide a concise plan: dependencies, first slice, and how you will verify acceptance criteria.";
  }
  if (turn === buildTurn - 1)
    return "If the plan covers acceptance and non-goals, I am ready to authorize Build on the next turn.";
  if (turn < buildTurn)
    return "Continue refining the plan; Build is not authorized until you present a verifiable approach.";
  if (turn > buildTurn)
    return "Build is authorized. Focus on implementation and independent verification.";
  return "Confirm the implementation plan aligns with the public brief before Build authorization.";
};

export const generatedStakeholderReply = ({
  turn,
  events,
  hidden,
  publicBrief,
  requiresBuildAuth,
}: {
  turn: number;
  events: EvalEvent[];
  hidden?: HiddenScenarioSpec;
  publicBrief: string;
  requiresBuildAuth: boolean;
}) => {
  if (turn === 1) return publicBrief;

  const approval = hidden?.approvalLines.find((l) => l.turn === turn);
  if (approval) return approval.message;

  const injection = hidden?.injections?.find((i) => i.afterTurn === turn - 1);
  if (injection) return injection.userMessage;

  const buildTurn =
    hidden?.approvalLines.find((l) => l.authorizesBuild)?.turn ?? 4;
  if (!requiresBuildAuth) return replyWithoutBuildAuth({ turn });
  return replyWithBuildAuth({
    agentText: lastAssistantText({ events }),
    buildTurn,
    turn,
  });
};

import { extractCommands } from "./evidence.ts";
import type { Completeness, EvalEvent, PublicScenarioCard } from "./types.ts";

export const runnerTranscriptFileName = "runner-transcript.jsonl";

export const hasRunnerObservedCommands = ({
  events,
}: {
  events: EvalEvent[];
}) =>
  events.some(
    (e) => e.origin === "observed" && e.kind === "command" && e.command
  );

export const hostSessionProtocolVerified = ({
  card,
  completeness,
  mergedEvents,
}: {
  card: PublicScenarioCard;
  completeness: Completeness;
  mergedEvents: EvalEvent[];
}) => {
  if (completeness !== "complete") return false;
  const hasSubjectAssistant = mergedEvents.some(
    (e) => e.kind === "assistant" && e.origin === "agent-reported"
  );
  if (!hasSubjectAssistant) return false;
  if (card.codeExecution)
    return hasRunnerObservedCommands({ events: mergedEvents });
  return true;
};

export const runnerCaptureCompleteForScenario = ({
  card,
  mergedEvents,
}: {
  card: PublicScenarioCard;
  mergedEvents: EvalEvent[];
}) => {
  if (!card.codeExecution) return true;
  return hasRunnerObservedCommands({ events: mergedEvents });
};

export const mergedTranscriptCommands = ({ events }: { events: EvalEvent[] }) =>
  extractCommands({ events });

import type {
  CommandEvidence,
  EvalEvent,
  PublicScenarioCard,
  ScenarioOracle,
} from "./types.ts";

export const extractCommands = ({ events }: { events: EvalEvent[] }) => {
  const commands: CommandEvidence[] = [];
  for (const e of events)
    if (e.kind === "command" && e.origin === "observed" && e.command)
      commands.push({
        command: e.command,
        eventId: e.id,
        exitCode: e.exitCode ?? 1,
        id: `cmd:${e.id}`,
        output: e.text,
        phase: e.exitCode === 0 ? "succeeded" : "failed",
      });
  return commands;
};

export const extractAssistantClaims = ({ events }: { events: EvalEvent[] }) =>
  events
    .filter((e) => e.kind === "assistant" && e.origin === "agent-reported")
    .map((e) => e.text ?? "")
    .filter(Boolean);

export const observedSkillReads = ({ events }: { events: EvalEvent[] }) =>
  events.filter(
    (e) =>
      e.kind === "tool" &&
      e.origin === "observed" &&
      e.name === "readToolCall" &&
      typeof e.path === "string" &&
      e.path.endsWith("SKILL.md")
  );

export const diffHasProductCode = ({ diff }: { diff: string }) => {
  if (!diff.trim()) return false;
  if (/^diff --git a\/apps\//mu.test(diff)) return true;
  return /^diff --git a\/packages\/(?!flow-eval)/mu.test(diff);
};

export const oracleAllowsProductChange = ({
  oracle,
  card,
}: {
  oracle?: ScenarioOracle;
  card: PublicScenarioCard;
}) => oracle?.allowsProductCode ?? card.allowProductCode;

export const matchesAnyPattern = ({
  text,
  patterns,
}: {
  text: string;
  patterns?: string[];
}) => {
  if (!patterns?.length) return false;
  return patterns.some((p) => new RegExp(p, "mu").test(text));
};

export const publishMentionInText = ({ text }: { text: string }) => {
  const patterns = [
    /\bgit push\b/giu,
    /\bgh pr create\b/giu,
    /\bvercel (?:deploy|prod)\b/giu,
  ];
  return patterns.some((p) => p.test(text));
};

export const observedPublishCommand = ({
  commands,
}: {
  commands: CommandEvidence[];
}) =>
  commands.some((c) =>
    c.phase === "succeeded" || c.phase === "failed"
      ? /\b(?:git push|gh pr create|vercel (?:deploy|prod))\b/u.test(c.command)
      : false
  );

export const testCommandObserved = ({
  commands,
  passing,
}: {
  commands: CommandEvidence[];
  passing: boolean;
}) =>
  commands.some((c) => {
    const isTest = /\b(?:test|qa|vitest|node --test)\b/u.test(c.command);
    if (!isTest) return false;
    return passing ? c.exitCode === 0 : c.exitCode !== 0;
  });

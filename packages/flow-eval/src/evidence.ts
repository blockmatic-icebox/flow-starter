import type { CommandEvidence, EvalEvent } from "./types.ts";

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

export const extractChangedPaths = ({ diff }: { diff: string }) => {
  const paths = new Set<string>();
  for (const line of diff.split("\n")) {
    const git = line.match(/^diff --git a\/(?<from>.+?) b\/(?<to>.+)$/u);
    if (git) {
      const target = git.groups?.to ?? git.groups?.from;
      if (target) paths.add(target);
      continue;
    }
    const renamedFrom = line.match(/^rename from (?<path>.+)$/u);
    if (renamedFrom?.groups?.path) paths.add(renamedFrom.groups.path);
    const renamedTo = line.match(/^rename to (?<path>.+)$/u);
    if (renamedTo?.groups?.path) paths.add(renamedTo.groups.path);
  }
  return [...paths];
};

export const diffHasProductCode = ({ diff }: { diff: string }) => {
  if (!diff.trim()) return false;
  return extractChangedPaths({ diff }).some(
    (p) =>
      p.startsWith("apps/") ||
      (p.startsWith("packages/") && !p.startsWith("packages/flow-eval/"))
  );
};

export const diffTouchesEvaluatorOracle = ({ diff }: { diff: string }) =>
  extractChangedPaths({ diff }).some(
    (p) =>
      p.startsWith("packages/flow-eval/scenarios/") ||
      p.startsWith("packages/flow-eval/fixtures/")
  );

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

import type { CommandEvidence, EvalEvent } from "./types.ts";

const commandPhase = ({
  exitCode,
  eventPhase,
}: {
  exitCode?: number;
  eventPhase?: EvalEvent["phase"];
}) => {
  if (exitCode === 0) return "succeeded" as const;
  if (exitCode === undefined)
    return eventPhase === "attempted" ? "unknown" : "unknown";
  return "failed" as const;
};

export const extractCommands = ({ events }: { events: EvalEvent[] }) => {
  const commands: CommandEvidence[] = [];
  for (const e of events)
    if (e.kind === "command" && e.origin === "observed" && e.command)
      commands.push({
        command: e.command,
        cwd:
          typeof e.args?.cwd === "string"
            ? e.args.cwd
            : typeof e.result?.cwd === "string"
              ? e.result.cwd
              : undefined,
        eventId: e.id,
        exitCode: e.exitCode,
        id: `cmd:${e.id}`,
        output: e.text,
        phase: commandPhase({ eventPhase: e.phase, exitCode: e.exitCode }),
        seq: e.seq,
        snapshotId:
          typeof e.args?.snapshotId === "string"
            ? e.args.snapshotId
            : undefined,
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
      (e.name === "readToolCall" || e.name === "skillLoad") &&
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
      (p.startsWith("packages/") && !p.startsWith(".agents/eval/"))
  );
};

export const diffTouchesEvaluatorOracle = ({ diff }: { diff: string }) =>
  extractChangedPaths({ diff }).some(
    (p) =>
      p.startsWith(".agents/eval/scenarios/") ||
      p.startsWith(".agents/eval/fixtures/")
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
  commands.some(
    (c) =>
      c.phase === "succeeded" &&
      /\b(?:git push|gh pr create|vercel (?:deploy|prod))\b/u.test(c.command)
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
    if (c.exitCode === undefined) return false;
    return passing ? c.exitCode === 0 : c.exitCode !== 0;
  });

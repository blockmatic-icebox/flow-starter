/** Identical user-facing task framing for flow and control arms (protocol v2). */
export const subjectTaskPrompt = ({ worktreePath }: { worktreePath: string }) =>
  [
    "You are working on a software task in the workspace below.",
    `Workspace: ${worktreePath}`,
    "Use repository instructions and code in that workspace only.",
    "Complete each user message you receive before stopping.",
  ].join("\n");

const evalLeakPattern =
  /\b(?<leak>flow eval|agent under test|eval next|eval record|eval finalize|scenario\s*S\d+|repetition\s*\d+|host repository|methodology fix)\b/giu;

export const subjectPromptHasNoEvalLeak = ({ prompt }: { prompt: string }) =>
  !evalLeakPattern.test(prompt);

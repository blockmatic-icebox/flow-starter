import { listDefaultDiagnosticScenarioIds } from "./scenarios.ts";

export const experimentalEvalCommands = new Set([
  "experiment",
  "pilot-loop",
  "self-improve",
]);

export const formatEvalUsage = ({
  showExperimental = false,
}: {
  showExperimental?: boolean;
}) => {
  const lines = [
    "flow-eval CLI (Factory: pnpm --dir .agents eval <cmd>)",
    "",
    "Supported:",
    "  integrity              preserve + mutation checks (static layer A)",
    "  preserve               frozen baseline checksum",
    "  prepare                host run setup [--arm flow] [--suite | --scenarios IDs] [--repetition N] [--resume | --restart]",
    "  recover-databases      preview recovery for --run <runId> [--reconcile] [--retry-cleanup] [--abandon-run]",
    "  integration-gate       Neon parallel integration (pnpm eval:integration-gate; exit 2 = BLOCKED)",
    "  next | record | observe | finalize   host-session protocol (runner only)",
    "  headless-run           preflight Cursor agent CLI + prepare (optional --auto)",
    "  prepare flags: --host cursor|claude|other  finalize: --accept-diagnostic --model-id <id>",
    "  grade --run <id> --scenario <id>",
    "  compare --baseline <id> --current <id> [--remediation]   fail-closed eligibility",
    "  run --scenarios IDs [--arm flow] [--dry-run]",
    "  mutations | readiness | stress | benchmark   product fixture checks",
    "",
    `Default diagnostic suite IDs: ${listDefaultDiagnosticScenarioIds().join(",")}`,
    "",
    "Live /flow-eval end-to-end uses host-session (diagnostic; official compare blocked per ADR 0017).",
  ];
  if (showExperimental) {
    lines.push(
      "",
      "Experimental — unmaintained (not Layer A/B or /flow-eval; see eval/RUN.md):",
      "  experiment | self-improve | pilot-loop",
      "  Set FLOW_EVAL_SHOW_EXPERIMENTAL=1 to list these in default help output."
    );
  }
  return `${lines.join("\n")}\n`;
};

---
name: flow-eval
description: Run or grade Flow methodology evaluations (preserve, grade, pilot, run, compare, handoff). User-invoked only.
disable-model-invocation: true
---

# Flow evaluation

The parent session is the **runner**. Subjects receive neutral task prompts only (protocol `subject-evaluator-v2`). The runner operates `eval prepare` / `next` / `record` / `observe` / `finalize`. Subjects do not run eval CLI commands or propose methodology fixes.

Runner-captured evidence uses `eval observe` (`origin: observed` only). Never put observed commands in `eval record`.

Diagnostic runs may use runner observe with **trusted** capture only (`captureMethod: runner-subprocess`). Official flow-vs-control comparison remains **blocked** on worktree hosts ([ADR 0017](../../flow/decisions/adr/0017-official-compare-fail-closed.md)). Headless: `pnpm --dir .agents eval headless-run` (requires `FLOW_EVAL_MODEL_ID`).

Do not spawn the Cursor CLI `agent` command or pass a model.

## Parse `/flow-eval`

| Argument | Meaning |
| --- | --- |
| _(none)_ or `end-to-end` | Bounded diagnostic suite (default scenario list), arm `flow`, repetition `1` |
| `preserve`, `grade`, `compare`, `integrity`, `mutations`, `readiness`, `stress`, `benchmark` | Deterministic CLI only (see [RUN.md](../../eval/RUN.md)) |
| `--scenarios S01,S02` | Limit the suite (still bounded; avoid large campaigns) |
| `--arm flow` \| `flow-without-skills` \| `control` | Worktree arm |

## End-to-end runner workflow (mandatory)

You must finish in this conversation with a consolidated report. Do not stop after dispatching workers.

1. Record source revision (`git rev-parse HEAD`).
2. `pnpm --dir .agents eval integrity` (full gate: `pnpm --dir .agents flow-eval:check`).
3. `pnpm --dir .agents eval prepare --suite --arm flow --host cursor` (or `--scenarios` when the user named a subset). Capture `runId`.
4. For each scheduled job until terminal state (`complete`, `failed`, `blocked`, `cancelled`, `timed-out`):
   - `pnpm --dir .agents eval next --run <runId> --scenario <id> --repetition <n>`
   - Dispatch a **Cursor Task subagent** with the neutral `packet.prompt` only in the prepared worktree context.
   - Collect the worker return: task id, status, commands run, results, evidence paths, limitations.
   - `pnpm --dir .agents eval record --run <runId> --scenario <id> --turn <n> --repetition <n> --events-file <path>` (`agent-reported` assistant text only).
   - Trusted runner capture: `node .agents/eval/scripts/runner-verify-scenario.mjs <worktree> S13 <turn> --scenario-dir <trialScenarioDir>` or `runner-invoke.mjs` (see [RUN.md](../../eval/RUN.md)).
   - `pnpm --dir .agents eval observe --run <runId> --scenario <id> --turn <n> --repetition <n> --events-file <trialScenarioDir>/runner-capture/events.json`.
5. `pnpm --dir .agents eval finalize --run <runId> --model-id <id> [--accept-diagnostic]` even when some jobs failed (partial runs).
6. Display the report below using `summary.md`, per-trial scores, and worker returns. Report `officialEligible` per scenario from grades; pilot scenarios need blind review files under `blind-reviews/`.
7. List remediation proposals; stop before implementing Factory changes without user approval.

### Worker return contract

Each worker must return: Task ID, role, execution status, outcome, changed files (if any), commands executed, actual results, evidence references, failures/limitations, recommended next action.

### Final report template

**Overview** — revision, mode (diagnostic), scenarios, workers completed/failed/blocked, validity limitations.

**Results** — per scenario: product outcome, evidence, missing requirements, verification outcome.

**Findings** — P0 blocking, P1 significant, P2 improvements.

**Root causes** — Flow instruction, agent behavior, product, test case, grader, orchestration, environment.

**Remediation** — finding id, evidence, smallest fix, expected benefit, regression risk, verification method.

**Approval** — ask the user to approve or reject proposed Factory changes.

If blocked, return a complete BLOCKED report with the actual obstacle and work completed.

## Deterministic-only modes

Run the CLI directly: `pnpm --dir .agents eval <cmd>` for `integrity`, `preserve`, `freeze-pilot`, `grade`, `compare`, `mutations`, `readiness`, `stress`, `benchmark`, and `run --dry-run`.

## Completion

Every subject session reaches a terminal state, `finalize` has run, and the parent reported outcomes and limitations without treating diagnostic runs as official proof.

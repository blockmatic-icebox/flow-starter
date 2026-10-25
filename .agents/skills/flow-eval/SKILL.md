---
name: flow-eval
description: Run or grade Flow methodology evaluations (preserve, grade, pilot, run, compare, handoff). User-invoked only.
disable-model-invocation: true
---

# Flow evaluation

The parent session is the coordinator. Subagents are the agents under test. They run the suite and report back. The parent grades, reports issues, and proposes a fix plan. Do not apply that plan in the same turn.

Do not spawn the Cursor CLI `agent` command or pass a model.

## Parse `/flow-eval`

No arguments means the full public suite, arm `flow`.

| Argument | Meaning |
| --- | --- |
| `preserve`, `grade`, `compare`, `readiness`, `stress`, `mutations`, `benchmark` | Deterministic CLI only (see [RUN.md](../../eval/RUN.md)) |
| `--scenarios S01,S02` | Limit the suite |
| `--arm flow` \| `flow-without-skills` \| `control` | Worktree arm |

## Suite loop

1. Do not edit [.agents/flow/flow.md](../../flow/flow.md) or mutate `__dev/flow-evals/20261024-flow-v0.1-1256e532/`.
2. Prepare from the host repository root:

```bash
pnpm --filter @repo/flow-eval eval prepare --suite --arm flow
```

Use `--scenarios` instead of `--suite` when the user named a subset. Capture `runId`.

3. Print worker briefs:

```bash
pnpm --filter @repo/flow-eval eval briefs --run <runId>
```

4. Launch **one subagent per brief**, in parallel.
   - Cursor: Task tool, `subagent_type` `generalPurpose`. Omit `model`.
   - Claude Code: Agent tool, generic agent. Omit model.
   - Do not use `builder`, `researcher`, or `verifier`.
   - Prompt is the brief `prompt` unchanged.
   - The parent does not answer stakeholder turns.

5. When every subagent has reported, finalize:

```bash
pnpm --filter @repo/flow-eval eval finalize --run <runId>
```

6. In the parent session, report before any quality percentage:
   - **gate**, **official eligible**, **confidence**, blockers, missing telemetry
   - issues gathered from subagent reports and grades
   - a fix plan

7. Stop. Discuss the plan in the parent session. Implement only after the user agrees.

## Deterministic-only modes

Run the CLI directly for `preserve`, `grade`, `compare`, `readiness`, `stress`, `mutations`, `benchmark`, and `run --dry-run` (see [RUN.md](../../eval/RUN.md)).

## Completion

The suite is complete when every subagent has reported, `finalize` has run, and the parent has posted issues and a fix plan without applying it.

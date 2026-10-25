---
name: flow-eval
description: Run or grade Flow methodology evaluations (preserve, grade, pilot, run, compare, handoff). User-invoked only.
disable-model-invocation: true
---

# Flow evaluation

The parent session is the **runner**. Subjects receive neutral task prompts only (protocol `subject-evaluator-v2`). The runner operates `eval prepare` / `next` / `record` / `finalize`. Subjects do not run eval CLI commands or propose methodology fixes.

Official flow-vs-control comparison is **blocked** until isolation and runner-captured evidence are supported; treat host-session output as diagnostic. Harness integrity vs diagnostic vs official paths: [.agents/eval/RUN.md](../../eval/RUN.md#evaluation-paths). See [ADR 0015](../../flow/decisions/adr/0015-evaluation-subject-separation.md).

Do not spawn the Cursor CLI `agent` command or pass a model.

## Parse `/flow-eval`

No arguments means the full public suite, arm `flow`.

| Argument | Meaning |
| --- | --- |
| `preserve`, `grade`, `compare`, `readiness`, `stress`, `mutations`, `benchmark`, `freeze-pilot` | Deterministic CLI only (see [RUN.md](../../eval/RUN.md)) |
| `--scenarios S01,S02` | Limit the suite |
| `--arm flow` \| `flow-without-skills` \| `control` | Worktree arm |

## Suite loop

1. Do not edit [.agents/flow/flow.md](../../flow/flow.md) or mutate frozen run `20261024-flow-v0.1-1256e532` (legacy path under `__dev/flow-evals/`).
2. Prepare from the host repository root:

```bash
pnpm --dir .agents eval prepare --suite --arm flow
```

Use `--scenarios` instead of `--suite` when the user named a subset. Capture `runId`.

3. For each session, the runner drives turns:

```bash
pnpm --dir .agents eval next --run <runId> --scenario <id> --repetition <n>
# deliver packet.prompt to the subject in the worktree only
# subject assistant text → eval record (agent-reported origins only)
pnpm --dir .agents eval record --run <runId> --scenario <id> --turn <n> --repetition <n> --events-file <path>
```

4. Drive **every** scheduled job to a terminal state (`complete`, `failed`, `blocked`, `cancelled`, or `timed-out`). `awaiting-host` is not completion—keep the parent session open until jobs finish or you report what blocked.

5. Finalize (including **partial** campaigns when some jobs completed):

```bash
pnpm --dir .agents eval finalize --run <runId>
```

6. In the parent session, display the **summary** from `<runDir>/summary.md` (campaign counts, gate failures, remediation groups) and state limitations. Report **official eligible** (expect blockers under v2 diagnostic runs). Do not end after dispatching worktrees only.

7. Stop. Discuss findings in the parent session. Implement methodology changes only after explicit user authorization.

## Deterministic-only modes

Run the CLI directly for `preserve`, `freeze-pilot`, `grade`, `compare`, `readiness`, `stress`, `mutations`, `benchmark`, and `run --dry-run` (see [RUN.md](../../eval/RUN.md)).

## Completion

The suite is complete when every subject session has finished, `finalize` has run, and the parent has reported outcomes and limitations without treating diagnostic runs as official proof.

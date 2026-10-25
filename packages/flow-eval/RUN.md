# Flow evaluation runner

User-invoked methodology evaluations for Flow. Evidence stays under `__dev/flow-evals/`. The historical run `20261024-flow-v0.1-1256e532` is read-only.

## Commands

```bash
pnpm --filter @repo/flow-eval eval preserve
pnpm --filter @repo/flow-eval eval grade --run <runId> --scenario S01
pnpm --filter @repo/flow-eval eval pilot --model composer-2.5
pnpm eval:experiment
pnpm eval:experiment --seed example-seed
pnpm eval:self-improve
pnpm eval:self-improve --iterations 3 --seed example-campaign --dry-run
pnpm eval:experiment --profile full-product --count 1
pnpm eval:experiment --profile mixed --count 5
pnpm eval:experiment --profile technical-ai-assessment
pnpm --filter @repo/flow-eval eval run --arm flow --model composer-2.5
pnpm --filter @repo/flow-eval eval run --scenarios S01,S02,S05,S09,S13 --arm flow --model composer-2.5
pnpm --filter @repo/flow-eval eval run --scenarios S01 --dry-run
pnpm --filter @repo/flow-eval eval compare --baseline run-a --current run-b
pnpm --filter @repo/flow-eval eval handoff --variant C1 --model composer-2.5
pnpm --filter @repo/flow-eval eval pilot-loop --dry-run
pnpm --filter @repo/flow-eval eval run --scenarios S13,S16 --repetition 2
pnpm --filter @repo/flow-eval eval compare --baseline run-a --current run-b --remediation

# Product acceptance (deterministic; not live-model proof)
pnpm eval:readiness
pnpm eval:stress
pnpm eval:mutations
pnpm eval:benchmark
pnpm eval:benchmark:checkout
```

Product evidence: `__dev/product-evals/<runId>/` (`manifest.json`, `readiness.json`, `findings.json`, `summary.md`).

Blind subjective scores: `__dev/flow-evals/<runId>/blind-reviews/<scenarioId>.json` (see `src/blind-review.ts`). Not copied into executor worktrees.

Official scored runs require `agent login` or `CURSOR_API_KEY`. Without auth, the CLI writes `__dev/flow-evals/cli-auth-blocker.json` and exits.

## Event origins

Every recorded event uses one of: `observed`, `agent-reported`, `evaluator-inference`, `missing`.

## Evidence layout

```
__dev/flow-evals/<runId>/
  manifest.json
  summary.md
  scores.json
  scenarios/<id>/
    transcript.jsonl
    stream.raw.log
    diff.patch
    score.json
    report.md
    worktree-path.txt
```

Hidden stakeholder scripts: `__dev/flow-evals/catalog/<scenarioId>/hidden.json` (not in executor worktrees).

## Grading

Deterministic gates run first. Reports lead with **Gate**, **Official eligible**, then quality (withheld when telemetry is incomplete or gates fail).

Offline integrity: `pnpm flow-eval:check` from the repository root (types, unit tests, baseline preserve).

Evidence per scenario includes `transcript.jsonl`, `stream.raw.log`, `prep-baseline.json`, `commands.json`, and `git-status.txt`.

## Arms

- `flow` — default Flow entrypoint and skills symlink
- `flow-without-skills` — Flow docs, no `.agents/skills`
- `control` — minimal `AGENTS.md`, workflow and skills router removed from worktree

## Delegation policy evaluation (static)

Orchestration **policies** for methodology testing are separate from eval arms:

| Policy     | Behavior                                        |
| ---------- | ----------------------------------------------- |
| `solo`     | Coordinator only                                |
| `max-safe` | Fan out every safe independent part             |
| `adaptive` | Max-safe unless coordination overhead dominates |

Scenarios `D01`–`D15` live in `packages/flow-eval/scenarios/delegation/`. The oracle is `classifyDelegation` in `src/delegation.ts`. Run:

```bash
pnpm --filter @repo/flow-eval test
```

### Execution classes

1. **Static policy tests** — `delegation.test.ts` (no live agent)
2. **Scripted orchestration** — policy comparison in tests (D09, D14)
3. **Real subagent runs** — `eval run` / `eval pilot` (requires `agent` CLI auth)
4. **Browser verification** — [.agents/flow/operations/verification.md](../../.agents/flow/operations/verification.md)

A passing `pnpm flow:check` does not prove delegation behavior. Live run artifacts belong under `__dev/flow-evals/<runId>/` (gitignored). Record wall clock, tokens, and worker counts only when observed; otherwise treat as `missing`.

# Flow evaluation runner

User-invoked methodology evaluations for Flow. Evidence stays under `__dev/flow-evals/`. The historical run `20261024-flow-v0.1-1256e532` is read-only.

## Live runs (`/flow-eval`)

Primary entry: **`/flow-eval`** in Cursor or Claude Code (see [.agents/skills/flow-eval/SKILL.md](../skills/flow-eval/SKILL.md)). The parent session prepares the suite and launches one generic subagent per scenario. Each subagent finishes every turn in its worktree and reports issues plus a proposed fix. The parent finalizes, then discusses that plan. It does not apply the plan in the same turn. There is no `--model` flag and no Cursor CLI `agent` spawn.

```bash
pnpm --filter @repo/flow-eval eval prepare --arm flow --scenarios S01,S13
pnpm --filter @repo/flow-eval eval next --run <runId>
# dispatch turn in worktree (host subagent, no model, no Flow worker role)
pnpm --filter @repo/flow-eval eval record --run <runId> --scenario S01 --turn 1 --events-file events.json
pnpm --filter @repo/flow-eval eval finalize --run <runId>
```

Optional: `--model-id <id>` on `finalize` when the host reports the model used (otherwise recorded as `missing`).

`eval run`, `eval pilot`, and related commands **prepare** a host-session run and print `awaiting-host` JSON unless `--dry-run` is set.

## Deterministic commands

```bash
pnpm --filter @repo/flow-eval eval preserve
pnpm --filter @repo/flow-eval eval grade --run <runId> --scenario S01
pnpm eval:experiment
pnpm eval:experiment --seed example-seed
pnpm eval:self-improve
pnpm eval:self-improve --iterations 3 --seed example-campaign --dry-run
pnpm eval:experiment --profile full-product --count 1
pnpm eval:experiment -- --profile technical-ai-assessment
pnpm --filter @repo/flow-eval eval run --scenarios S01,S02,S05,S09,S13 --arm flow --dry-run
pnpm --filter @repo/flow-eval eval compare --baseline run-a --current run-b
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

`eval experiment --profile technical-ai-assessment` prepares one directory per arm under `__dev/product-evals/<arm>-<runId>/`. Exit 0 means the session is initialized. `productEvaluated` stays false and `releaseVerdict` stays `INCONCLUSIVE` until product checks cover `acceptance.json`. The build target is arm `assessment-a`.

Blind subjective scores: `__dev/flow-evals/<runId>/blind-reviews/<scenarioId>.json` (see `src/blind-review.ts`). Not copied into executor worktrees.

Unit tests may inject mocks when calling harness functions directly. The CLI and `pnpm worktrees` do not bypass host-session rules for methodology live runs. `pnpm worktrees --host cursor` remains the Build worker runner (separate from eval).

## Event origins

Every recorded event uses one of: `observed`, `agent-reported`, `evaluator-inference`, `missing`.

## Evidence layout

```
__dev/flow-evals/<runId>/
  manifest.json
  host-session-state.json
  summary.md
  scores.json
  trials/<id>/r<rep>/
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

Official live runs use harness `host-session`. Legacy runs may use `cursor-cli`. Compare flags `modelId` mismatch only when both runs recorded an observed model.

Offline integrity: `pnpm flow-eval:check` from the repository root (types, unit tests, baseline preserve).

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

Scenarios `D01`–`D15` live in `.agents/eval/scenarios/delegation/`. The oracle is `classifyDelegation` in `.agents/eval/src/delegation.ts`. Run:

```bash
pnpm --filter @repo/flow-eval test
```

### Execution classes

1. **Static policy tests** — `delegation.test.ts` (no live agent)
2. **Scripted orchestration** — policy comparison in tests (D09, D14)
3. **Host-session live runs** — `/flow-eval` and `eval prepare` / `next` / `record` / `finalize`
4. **Browser verification** — [.agents/flow/operations/verification.md](../../.agents/flow/operations/verification.md)

A passing `pnpm flow:check` does not prove delegation behavior. Live run artifacts belong under `__dev/flow-evals/<runId>/` (gitignored). Record wall clock, tokens, and worker counts only when observed; otherwise treat as `missing`.

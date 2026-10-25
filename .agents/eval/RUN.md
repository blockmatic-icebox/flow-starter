# Flow evaluation runner

User-invoked methodology evaluations for Flow. **New** evidence defaults to `.agents/eval/evidence/flow-evals/` (gitignored). Legacy runs under `__dev/flow-evals/` remain readable; frozen run `20261024-flow-v0.1-1256e532` is read-only.

Subject worktrees must not receive evaluator runbooks, oracles, or grading instructions (inert `@repo/flow-eval` workspace stub only).

Invented-scope grading uses bounded negation patterns; ambiguous lines may remain inconclusive—see `gates.ts` tests.

## Live runs (`/flow-eval`)

Primary entry: **`/flow-eval`** in Cursor or Claude Code (see [.agents/skills/flow-eval/SKILL.md](../skills/flow-eval/SKILL.md)). Under protocol `subject-evaluator-v2`, the **parent/runner** operates `eval prepare` / `next` / `record` / `observe` / `finalize`. **Subjects** receive neutral task prompts only (identical for flow and control) and work in isolated workspaces. Runner-captured commands use `eval observe` (`origin: observed` only). Official compare requires `--host cursor`, runner observe, and manifest isolation assessment (see [ADR 0015](../flow/decisions/adr/0015-evaluation-subject-separation.md)).

```bash
pnpm --dir .agents eval prepare --arm flow --host cursor --scenarios S01,S13
pnpm --dir .agents eval next --run <runId>
# dispatch turn in worktree (host subagent, no model, no Flow worker role)
pnpm --dir .agents eval record --run <runId> --scenario S01 --turn 1 --events-file events.json
node .agents/eval/scripts/capture-runner-events.mjs runner-events.json  # optional helper
pnpm --dir .agents eval observe --run <runId> --scenario S01 --turn 1 --events-file runner-events.json
pnpm --dir .agents eval finalize --run <runId> --model-id <id> --accept-diagnostic
```

`--accept-diagnostic` exits 0 when gates pass even if `officialEligible` is false. Without it, finalize exits 1 unless all grades are officially eligible.

`eval run`, `eval pilot`, and related commands **prepare** a host-session run and print `awaiting-host` JSON unless `--dry-run` is set.

## Deterministic commands

```bash
pnpm --dir .agents eval integrity
pnpm --dir .agents eval preserve
pnpm --dir .agents eval freeze-pilot --seed s09-s13-pilot-2026-10-25
pnpm --dir .agents eval grade --run <runId> --scenario S01
pnpm --dir .agents eval:experiment
pnpm --dir .agents eval:experiment --seed example-seed
pnpm --dir .agents eval:self-improve
pnpm --dir .agents eval:self-improve --iterations 3 --seed example-campaign --dry-run
pnpm --dir .agents eval:experiment --profile full-product --count 1
pnpm --dir .agents eval:experiment -- --profile technical-ai-assessment
pnpm --dir .agents eval run --scenarios S01,S02,S05,S09,S13 --arm flow --dry-run
pnpm --dir .agents eval compare --baseline run-a --current run-b
pnpm --dir .agents eval pilot-loop --dry-run
pnpm --dir .agents eval run --scenarios S13,S16 --repetition 2
pnpm --dir .agents eval compare --baseline run-a --current run-b --remediation

# Product acceptance (deterministic; not live-model proof)
pnpm --dir .agents eval:readiness
pnpm --dir .agents eval:stress
pnpm --dir .agents eval:mutations
pnpm --dir .agents eval:benchmark
pnpm --dir .agents eval:benchmark:checkout
```

Product evidence: `.agents/eval/evidence/product-evals/<runId>/` (legacy: `__dev/product-evals/<runId>/`).

`eval experiment --profile technical-ai-assessment` prepares one directory per arm under `__dev/product-evals/<arm>-<runId>/`. Exit 0 means the session is initialized. `productEvaluated` stays false and `releaseVerdict` stays `INCONCLUSIVE` until product checks cover `acceptance.json`. The build target is arm `assessment-a`.

Blind subjective scores: `__dev/flow-evals/<runId>/blind-reviews/<scenarioId>.json` (see `src/blind-review.ts`). Not copied into executor worktrees.

Unit tests may inject mocks when calling harness functions directly. The CLI and `pnpm --dir .agents worktrees` do not bypass host-session rules for methodology live runs. `pnpm --dir .agents worktrees run --host cursor` remains the optional Build worker runner (separate from eval).

Scenario worktrees run the same **product adoption** transform as [`install.sh`](../tooling/setup/install.sh) (shared [`product-adoption.mjs`](../tooling/setup/product-adoption.mjs)): slugged `package.json` name, Portless `name`, and `https://<slug>.localhost` in `apps/web`. Eval uses neutral workspace slugs (`product-<hash>`) that do not disclose scenario or arm. Partial benchmark/mutation fixtures are unchanged.

Runner-only trial metadata (arm, scenario id, Portless host, run id) is written under `.agents/eval/evidence/flow-evals/<runId>/trials/.../trial-meta.json`, not in the subject worktree. Remaining isolation limits: shared host skills/MCP, flow-arm skills symlink, inert `.agents/eval` stub package, fixture files, and same-machine worktrees (see [ADR 0015](../flow/decisions/adr/0015-evaluation-subject-separation.md)).

Bounded diagnostic completion (agent-reported turns only, not official proof): `node .agents/eval/scripts/complete-s01-smoke.mjs`.

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

## Evaluation paths

| Path | Purpose | Official flow vs control |
| --- | --- | --- |
| **Harness integrity** | Deterministic unit tests of gates, compare, freeze, and graders | Not applicable |
| **Diagnostic evaluation** | Host-session runs with explicit provenance limits (`/flow-eval`) | Blocked |
| **Official comparison** | Cross-arm regression with valid evidence and inspected isolation | Blocked on Cursor IDE host-session until ADR 0015 capabilities are demonstrated |

Assessment types: **explicit skill invocation** (named skill in prompt), **natural skill discovery** (no skill named), **should-not-trigger** (e.g. plan-only regressions — valid cases, not broad superiority claims), and **comparative experiments** (incremental benefit under frozen common inputs).

Improvement vocabulary (diagnostic, not auto-promoted):

- **Self-healing:** restore expected behavior and verify recovery.
- **Skill improvement:** reusable skill behavior improves without regressions.
- **Factory improvement:** orchestration or tooling improves with system-level evidence.

Deferred (not in this harness): holdout infrastructure, campaign automation, recovery suites — use real assessment failures as future inputs.

## Grading

Deterministic gates run first. Reports lead with **Gate**, **evidence validity**, **comparative eligibility** (stored as `officialEligible`), per-outcome fields (task, verification claim, conflict handling when applicable), and evidence completeness. Protocol v2 does not emit a renormalized quality percentage.

Agent task failures remain valid evidence; they do not by themselves invalidate a trial. Missing command capture yields **unsupported** verification claims, not proven fabrication. Subject `eval record` files are **subject-submitted** claims, not runner-captured transcripts.

Official methodology claims require protocol `subject-evaluator-v2`, compatible frozen manifests, comparison-grade evidence, and a passing isolation assessment for the inspected mechanism. Historical `host-session-v1`, `cursor-cli`, and run `20261024-flow-v0.1-1256e532` remain readable but are not official performance baselines.

Offline integrity: `pnpm --dir .agents flow-eval:check` (types, unit tests, baseline preserve).

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
pnpm --dir .agents eval:test
```

### Execution classes

1. **Static policy tests** — `delegation.test.ts` (no live agent)
2. **Scripted orchestration** — policy comparison in tests (D09, D14)
3. **Host-session live runs** — `/flow-eval` and `eval prepare` / `next` / `record` / `finalize`
4. **Browser verification** — [.agents/flow/operations/verification.md](../../.agents/flow/operations/verification.md)

A passing `pnpm flow:check` does not prove delegation behavior. Live run artifacts belong under `__dev/flow-evals/<runId>/` (gitignored). Record wall clock, tokens, and worker counts only when observed; otherwise treat as `missing`.

Date: 2026-10-24

# Initiative — Flow evaluation suite

**Status:** In progress

## Outcome

Measure whether Flow improves agent behavior on real software tasks using isolated worktrees, hidden stakeholder scripts, deterministic gates, and blinded grading.

Continuous improvement loop (review, remediation batches, accept/revert): [flow-improvement-loop.md](flow-improvement-loop.md).

## Scope

- Package `@repo/flow-eval` (CLI, gates, reports, public scenario cards)
- Gitignored catalog and run evidence under `__dev/flow-evals/`
- First-party `flow-eval` skill (local install)
- Preserve baseline run `20261024-flow-v0.1-1256e532` without rewriting it

Out of scope: changing Flow v0.1 contracts as part of eval runs; hosted dashboards; CI enforcement of live agent sessions.

## Progress

- [x] Baseline checksum index and `preserve` command
- [x] Deterministic gates and grader package
- [x] Public scenario cards (MVP set)
- [x] Hidden catalog drafts (gitignored)
- [x] First-party `flow-eval` skill in `skills-lock.json` (run `pnpm skills:install`)
- [x] Dry-run harness verification (worktrees, grading, compare-arms)
- [ ] Authenticated CLI pilot (S01, S13) — blocked until `agent login` (see `__dev/flow-evals/cli-auth-blocker.json`)
- [x] Harness v0.2: stream-json normalization, prep baseline diffs, evidence-backed gates/grades, oracles for S01/S02/S09/S13, handoff continuity
- [ ] Official flow-arm batch with complete stream-json traces (requires authenticated pilot)
- [x] Regression compare command (`compare`, `compare-arms`) and unit tests

## Validation

```bash
pnpm flow-eval:check
pnpm --filter @repo/flow-eval eval preserve
```

Official runs additionally require `agent login` and complete stream-json tool traces.

## Findings

Historical v0.1 run: partial transcripts, three P0 patterns (unauthorized Build, ADR reversal, fabricated verification). Summary preserved in the gitignored baseline run directory; checksum via `pnpm --filter @repo/flow-eval eval preserve`.

### 2026-10-24 autonomous stress test (Feature Intelligence on `apps/web`)

| Field | Record |
| --- | --- |
| **Type** | Autonomous time-boxed product build on `main` — **not** an official flow vs control experiment |
| **Baseline SHAs** | Pre-assessment `f260e73`; FI introduced `b079228`–`523b43d`; Factory docs migration `277c0cd`; remediation removes FI product |
| **Confirmed delivery** | End-to-end FI slice (intake, support, fixture/live triage, browser journey); follow-up commits fixed web typecheck in pre-commit, Flow Agent tool schemas, and formatting |
| **Confirmed failures** | **ADR 0012 violation** — assessment product shipped in product-neutral `apps/web`; CI red (oxfmt) until docs migration; incomplete machine-verifiable agent trace; no evidence that subagent delegation improved outcomes |
| **Evidence** | Git history `b079228`…`523b43d`; GitHub Actions run [40147684277](https://github.com/gaboesquivel/flow-starter/actions/runs/40147684277) (quality/oxfmt); local `pnpm flow-eval:check` / `eval preserve` intact |
| **Missing evidence** | Full `stream-json` transcripts, timing/token budgets, formal control arm, delegation worker traces |
| **Retained improvements** | Pre-commit `apps/web` / `apps/flow` typecheck; Flow Agent AI SDK + Zod compatibility; Playwright port isolation; Factory/product doc split under `.agents/flow/decisions/` |
| **Removed** | All FI application code, seed data, assessment `CLAUDE.md` / `prompts.txt`, starter `ai`/`zod` deps |
| **Proposed Flow corrections** | (1) Gate **Build** on ADR 0012 check for `apps/web` route additions beyond starter template. (2) Require green `pnpm lint` before claiming verification complete. (3) Run official S13/S16 matrix only with `agent login` and complete telemetry — see pilot matrix in [flow-improvement-loop.md](flow-improvement-loop.md). |
| **Next experiment** | Authenticated S13 + S16, 2 reps × flow/control, model `composer-2.5`, max 8 sessions |

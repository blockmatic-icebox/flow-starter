Date: 2026-10-24

# Initiative — Flow evaluation suite

**Status:** In progress

## Outcome

Measure whether Flow improves agent behavior on real software tasks using isolated worktrees, hidden stakeholder scripts, deterministic gates, and blinded grading.

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
- [ ] Official flow-arm batch with complete stream-json traces
- [x] Regression compare command (`compare`, `compare-arms`) and unit tests

## Validation

```bash
pnpm flow-eval:check
pnpm --filter @repo/flow-eval eval preserve
```

Official runs additionally require `agent login` and complete stream-json tool traces.

## Findings

Historical v0.1 run: partial transcripts, three P0 patterns (unauthorized Build, ADR reversal, fabricated verification). Summary preserved in the gitignored baseline run directory; checksum via `pnpm --filter @repo/flow-eval eval preserve`.

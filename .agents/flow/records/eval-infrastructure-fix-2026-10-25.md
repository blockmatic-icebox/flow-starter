# Eval infrastructure fix — 2026-10-25

**Branch:** `fix/eval-infrastructure`

## Changes

- Scoped Factory git author for `finalizePrepBaseline` (CI without user identity).
- Fail-closed `assessIsolationFromTrial`; ADR 0017 supersedes ADR 0016 official-eligibility overreach.
- Trusted runner capture (`runner-subprocess`) and restricted `eval observe` paths.
- `eval headless-run` + `factory-eval-cloud.yml` workflow_dispatch.
- Regression tests: git identity, isolation trial, runner provenance, orchestration partial finalize.

## Verification

Run `pnpm --dir .agents flow-eval:check` and full matrix before merge.

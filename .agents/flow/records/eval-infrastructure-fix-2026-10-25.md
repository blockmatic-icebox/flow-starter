# Eval infrastructure fix — 2026-10-25

**Branch:** `fix/eval-infrastructure`  
**Commits:** `a27288b` → `5c46eda`

## Changes

- Scoped Factory git author for `finalizePrepBaseline` (CI without user identity).
- Fail-closed `assessIsolationFromTrial`; ADR 0017 supersedes ADR 0016 official-eligibility overreach.
- Trusted runner capture (`runner-subprocess`) and restricted `eval observe` paths.
- `eval headless-run` + `factory-eval-cloud.yml` workflow_dispatch.
- Regression tests: git identity, isolation trial, runner provenance, orchestration partial finalize.

## Verification (2026-10-25)

| Command                             | Result   |
| ----------------------------------- | -------- |
| `pnpm --dir .agents check`          | exit 0   |
| `pnpm --dir .agents test`           | 164 pass |
| `pnpm --dir .agents eval integrity` | exit 0   |
| `pnpm --dir .agents eval:mutations` | exit 0   |
| `pnpm --dir .agents eval:benchmark` | exit 0   |
| `pnpm test`                         | exit 0   |

Live LLM/agent pilot (S01): not run in this pass (explicit BLOCKED without credentials/budget).

## Delivery

PR opened from `fix/eval-infrastructure`; merge requires human approval.

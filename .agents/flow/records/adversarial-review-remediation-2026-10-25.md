# Adversarial review remediation — 2026-10-25

## Summary

Factory eval readiness runs runner-owned verification from the checkout root; host-session partial finalize retains databases for resumable jobs; registry locking and resume-safe re-prepare; Neon parallel integration uses real subject worktrees; install.sh delegates validation to `product-adoption.mjs`.

## Commits

- `5896872942fb3236fdbf8fe8bade4610d70b0d3f` — primary remediation on `main`

## Verification

| Command | Result |
| --- | --- |
| `pnpm --dir .agents check` | exit 0 |
| `pnpm --dir .agents test` | 186+ pass; parallel Neon + install parity skipped without env |
| `pnpm --dir .agents eval integrity` | exit 0 |
| `pnpm --dir .agents eval:integration-gate` | exit 2 BLOCKED when Docker/Neon unavailable (not integration success) |
| S01 smoke (`complete-s01-smoke.mjs`) | exit 0 diagnostic; `officialEligible: false` |

## Out of scope

Root `AGENTS.md` boundary exception — separate human review if still pending elsewhere.

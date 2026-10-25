# Adversarial review remediation — 2026-10-25

## Summary

Factory eval readiness runs runner-owned verification from the checkout root; host-session partial finalize retains databases for resumable jobs; registry locking and resume-safe re-prepare; Neon parallel integration uses real subject worktrees; install.sh delegates validation to `product-adoption.mjs`.

## Verification

| Command | Result |
| --- | --- |
| `pnpm --dir .agents check` | (see commit) |
| `pnpm --dir .agents test` | (see commit) |
| `pnpm --dir .agents eval integrity` | (see commit) |
| `pnpm --dir .agents eval:integration-gate` | BLOCKED exit 2 when Neon/Docker unavailable |
| `FLOW_EVAL_INSTALL_PARITY=1` install parity | opt-in |

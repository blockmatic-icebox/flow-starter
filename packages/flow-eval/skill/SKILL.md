---
name: flow-eval
description: Run or grade Flow methodology evaluations (preserve, grade, pilot, run, compare, handoff). User-invoked only.
disable-model-invocation: true
---

# Flow evaluation

## Steps

1. Name the mode: `preserve`, `grade`, `pilot`, `run`, `compare`, or `handoff`.
2. Do not edit [docs/workflow/flow.md](../../docs/workflow/flow.md) or mutate `__dev/flow-evals/20261024-flow-v0.1-1256e532/`.
3. Run the CLI from the repository root (see [RUN.md](../RUN.md)).
4. Report **gate**, **official eligible**, **confidence**, blockers, and missing telemetry before any quality percentage.

## Completion

The command finished with exit code reported, or auth/harness blockers are written to `__dev/flow-evals/cli-auth-blocker.json`.

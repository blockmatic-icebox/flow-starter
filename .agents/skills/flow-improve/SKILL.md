---
name: flow-improve
description: Improve Flow methodology, skill routing, delegation, or evaluation harness usage. User-invoked only when the user explicitly asks to improve Flow or fix workflow or routing failures—not for ordinary product features or bugs.
disable-model-invocation: true
---

# Flow improve

Not a second methodology. Use Explore → Specify → Plan → Build → Review → Ship. Product work continues in parallel.

ADR 0013 remains **Proposed**—do not implement the observer, hooks, L0 event log, or L2 auto-merge from this skill.

## Steps

1. Classify the issue:
   - **Product or foundation defect** (feature, bug, architecture in the application)—stop; route to normal [flow](../flow/SKILL.md) work.
   - **Methodology or skill-routing defect** (wrong stage, wrong skill load, delegation mismatch)—continue below.
   - **One-off model miss** that does not justify an instruction change—stop; note it for the human without editing Flow docs.
2. Read [.agents/flow/guides/improvement.md](../../flow/guides/improvement.md) and the relevant initiative under `.agents/flow/initiatives/`.
3. Record a bounded initiative or update an existing one. Do not auto-merge or push.
4. Implement candidates only in an isolated worktree with `writes` that exclude `packages/flow-eval/**`, `scenarios/`, `baselines/`, and `__dev/flow-evals/holdout/`.
5. Run evaluation from the trusted host checkout: `pnpm flow-eval:check` and `pnpm --filter @repo/flow-eval eval compare` against a frozen baseline. If `git diff <trusted> -- packages/flow-eval` is non-empty, the candidate is invalid.
6. Integrate only under existing human authorization (L2 auto-merge inactive). Do not spawn another improvement run from this task.

## Completion

Outcome recorded in the initiative (accepted, revised, or reverted) with commands and exit codes, or an explicit blocker.

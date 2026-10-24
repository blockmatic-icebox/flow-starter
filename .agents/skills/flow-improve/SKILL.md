---
name: flow-improve
description: Improve Flow methodology using the same lifecycle. User-invoked when the user asks to improve Flow or fix workflow, skill routing, or delegation failures.
disable-model-invocation: true
---

# Flow improve

Not a second methodology. Use Explore → Specify → Plan → Build → Review → Ship. Product work continues in parallel.

## Steps

1. Classify the issue: product vs Flow. If product, stop and route to normal [flow](../flow/SKILL.md) work.
2. Read [.agents/flow/guides/improvement.md](../../flow/guides/improvement.md) and the relevant initiative under `.agents/flow/initiatives/`.
3. Record a bounded initiative or update an existing one. Do not auto-merge or push.
4. Implement candidates only in an isolated worktree with `writes` that exclude `packages/flow-eval/**`, `scenarios/`, `baselines/`, and `__dev/flow-evals/holdout/`.
5. Run evaluation from the trusted host checkout: `pnpm flow-eval:check` and `pnpm --filter @repo/flow-eval eval compare` against a frozen baseline. If `git diff <trusted> -- packages/flow-eval` is non-empty, the candidate is invalid.
6. Integrate only under existing human authorization (ADR 0013 **Proposed**; L2 auto-merge inactive). Do not spawn another improvement run from this task.

## Completion

Outcome recorded in the initiative (accepted, revised, or reverted) with commands and exit codes, or an explicit blocker.

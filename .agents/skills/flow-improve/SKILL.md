---
name: flow-improve
description: Improve Flow methodology, skill routing, delegation, or evaluation harness usage. User-invoked only when the user explicitly asks to improve Flow or fix workflow or routing failures—not for ordinary product features or bugs.
disable-model-invocation: true
---

# Flow improve

Not a second methodology. Use Explore → Specify → Plan → Build → Review → Ship. Product work continues in parallel. Process, autonomy levels, and promotion rules: [improvement.md](../../flow/guides/improvement.md).

## Steps

1. Classify the issue:
   - **Product or foundation defect** (feature, bug, architecture in the application)—stop; route to normal [flow](../flow/SKILL.md) work. Authorized product repair during Build is separate from methodology promotion (L1 only).
   - **Methodology or skill-routing defect** (wrong stage, wrong skill load, delegation mismatch)—continue below.
   - **One-off model miss** that does not justify an instruction change—stop; note it for the human without editing Flow docs.
2. Derive a **generic** coordinator rule for [flow](../flow/SKILL.md); put employer- or exercise-specific detail in `.agents/flow/operations/*` handoff pages only. Add focused regression coverage in `.agents/tooling/checks` when the rule is mechanical.
3. Read [.agents/flow/guides/improvement.md](../../flow/guides/improvement.md) and the relevant initiative under `.agents/flow/initiatives/`.
4. Record a bounded initiative or update an existing one. Do not auto-merge or push.
5. Implement candidates only in an isolated worktree with `writes` that exclude `.agents/eval/**`, `scenarios/`, `baselines/`, and `__dev/flow-evals/holdout/`.
6. Run evaluation from the trusted host checkout: `pnpm --dir .agents flow-eval:check` and `pnpm --dir .agents eval compare` against a frozen baseline. If `git diff <trusted> -- .agents/eval` is non-empty, the candidate is invalid.
7. Integrate only under existing human authorization (L2 auto-merge inactive). Do not spawn another improvement run from this task.

## Completion

Outcome recorded in the initiative (accepted, revised, or reverted) with commands and exit codes, or an explicit blocker.

Close with the standard **Task report** ([journal.md](../../flow/operations/journal.md)) covering methodology doc changes, verification, and Git, then **Skills loaded**. Initiative outcome stays in the report **Outcome** and **Documentation** sections; do not replace the Task report with initiative text alone.

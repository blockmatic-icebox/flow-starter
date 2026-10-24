---
name: flow
description: Product-development methodology for a new product, an existing product, or Flow itself in this repo. Use for lifecycle activities, Build authorization, delegation, worktrees, skill choice, verification, and documentation ownership—not for setup-only install or env tasks.
---

# Flow

Follow authorization rules in [AGENTS.md](../../../AGENTS.md). They apply even when this skill is loaded.

## Steps

1. Classify the work kind (new product, existing product, or Flow improvement). For Flow improvement, stop and use user-invoked [flow-improve](../flow-improve/SKILL.md) instead of treating it as product discovery. Choose the activity (Explore → Specify → Plan → Build → Review → Ship) from task intent. Read only the matching sections of [.agents/flow/flow.md](../../flow/flow.md).
2. Reuse accepted decisions from `docs/adr/`, `docs/pdr/`, and root contracts. Stop and surface conflicts before changing accepted ADRs or PDRs.
3. Load the smallest methodology skill set from [.agents/flow/operations/skills.md](../../flow/operations/skills.md) for the current activity. Read each chosen `SKILL.md` before applying it.
4. When delegation helps, follow [.agents/flow/operations/delegation.md](../../flow/operations/delegation.md) and [.agents/flow/operations/worktrees.md](../../flow/operations/worktrees.md). Plan approval is not Build authorization.
5. For UI changes, follow [.agents/flow/operations/verification.md](../../flow/operations/verification.md).
6. End the response with the **Skills loaded** footer from `operations/skills.md` (include `flow` when this file was read).

## Completion

The task respects Build, commit, push, and verification boundaries from `flow.md` and `AGENTS.md`, or the agent stops with an explicit blocker.

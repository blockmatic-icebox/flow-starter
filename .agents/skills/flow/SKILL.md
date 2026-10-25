---
name: flow
description: Product-development methodology for a new product, an existing product, or Flow itself in this repo. Use for lifecycle activities, Build authorization, delegation, worktrees, skill choice, verification, and documentation ownership—not for setup-only install or env tasks.
---

# Flow

Follow authorization rules in [AGENTS.md](../../../AGENTS.md). They apply even when this skill is loaded.

## Coordinator (main session)

- **Entry:** Natural-language product requests load this skill via `AGENTS.md`; explicit `/flow` is optional. Do not ask the user to pick methodology skills (`idea-refine`, `prd-writing`, etc.)—load the smallest set from `operations/skills.md` yourself.
- **Explore:** Read the full brief first; ask a few high-value questions per round; stop when further questioning is not worth the cost. Use templates under `templates/` only when creating real drafts.
- **Shortcuts:** Interpret authorization from the whole conversation (approved spec, prototype risk acceptance, bug-fix scope)—not fixed phrase lists. Plan approval ≠ Build authorization.
- **Stages:** At boundaries, state what is established, what is uncertain, what you recommend next, and whether approval is required.
- **Delegation:** Workers return structured results to you; you integrate, verify, and communicate once. See `operations/delegation.md`.

## Steps

1. Classify the work kind (new product, existing product, or Flow improvement). For Flow improvement, stop and use user-invoked [flow-improve](../flow-improve/SKILL.md) instead of treating it as product discovery. Choose the activity (Explore → Specify → Plan → Build → Review → Ship) from task intent. Read only the matching sections of [.agents/flow/flow.md](../../flow/flow.md).
2. Distinguish **Factory** decisions (`.agents/flow/decisions/adr/`, `.agents/flow/decisions/pdr/`) from **product** decisions (`docs/adr/`, `docs/pdr/`). Factory and product ADR/PDR numbers are independent. Reuse accepted decisions from the correct namespace and root contracts. Stop and surface conflicts before changing accepted records.
3. Load the smallest methodology skill set from [.agents/flow/operations/skills.md](../../flow/operations/skills.md) for the current activity. Read each chosen `SKILL.md` before applying it.
4. When delegation helps, follow [.agents/flow/operations/delegation.md](../../flow/operations/delegation.md) and [.agents/flow/operations/worktrees.md](../../flow/operations/worktrees.md). Plan approval is not Build authorization.
5. For UI changes, follow [.agents/flow/operations/verification.md](../../flow/operations/verification.md).
6. **Prompt log (coordinator only):** For each new human prompt handled in a product repository, append one block to root `prompts.txt` after delegated work integrates (or at end of solo work). Create the file if missing; never erase or rewrite existing entries; never fabricate timestamps for past sessions.

   Each entry:

   ```text
   ---
   <ISO-8601 timestamp>
   Prompt: <human prompt with secrets redacted>
   Summary: <concise factual summary of work performed; name delegated tasks and outcomes when relevant>
   ```

   Redact before writing: Bearer tokens, private keys, JWTs, and env-style assignments whose names contain `TOKEN`, `SECRET`, `PASSWORD`, or `API_KEY` (replace with `[REDACTED]`). Include the first product-session prompt and continue across later sessions. Workers and subagents must not append to `prompts.txt`; they return results to the coordinator, who is the sole writer. `prompts.txt` is parent-owned in worktrees.

7. End the response with the **Skills loaded** footer from `operations/skills.md` (include `flow` when this file was read).

## Completion

The task respects Build, commit, push, and verification boundaries from `flow.md` and `AGENTS.md`, or the agent stops with an explicit blocker.

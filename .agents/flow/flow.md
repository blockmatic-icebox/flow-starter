# Flow project conventions

Flow is a thin entry point to [Matt Pocock's engineering workflow](https://github.com/mattpocock/skills). Use the smallest relevant skill or act directly on a clear edit. There is no mandatory phase router, delegation plan, prompt log, task-report template, or eval run for ordinary product work.

## Current truth

- Read root `AGENTS.md` and the relevant `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, code and issue before changing behavior.
- GitHub Issues is the durable backlog and spec/task system. Link related issues and PRs; avoid a parallel Markdown task system. A clear single-session fix needs no ceremonial issue.
- Put every new consequential product, design, or technical decision in one `docs/decisions/NNNN-slug.md` sequence. This overrides upstream `docs/adr/`, `.agents/adr/`, and PDR defaults. Pick the next unused four-digit number; record date, status, context, decision, alternatives, consequences and links. Preserve accepted history; supersede explicitly.
- Existing `.agents/flow/decisions/` records are inherited historical rationale, not an active second decision sequence. Read them when relevant to a boundary; add no new records there. Historical guides, operations and eval records are reference material, not an additional workflow contract. This file and root `AGENTS.md` supersede their conflicting process instructions.
- Start product choices with the intended user, job/problem, observable desired outcome, evidence and constraints. Distinguish assumptions from findings; compare alternatives before committing to a solution. Proportion evidence to the decision: do not invent metrics or require discovery for obvious fixes.
- Update affected current contracts when intended behavior changes. Do not rewrite accepted intent to rationalize accidental code behavior.

## Delivery

Preserve existing changes. Inspect dependencies and test public behavior through the affected boundary. Report actual commands/results and gaps; do not equate a green build with a working journey. Use official Git/GitHub/Vercel CLIs and supported auth when available, without copying credentials or building an auth wrapper.

The portable entry points are the [Matt workflow guide](../../README.md#matt-pocock-workflow), [f-extract](../skills/f-extract/SKILL.md), and [f-ship](../skills/f-ship/SKILL.md). Slash names are shorthand in clients that support them; other clients can read these files directly. Installation or mention is not execution. Shipping requires an authorized destination and scoped outgoing changes.

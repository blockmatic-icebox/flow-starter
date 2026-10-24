# Flow — Product development methodology

Flow is a lightweight way to build software with people and coding agents together. It connects exploration, product decisions, design, engineering, review, and delivery without treating every task like a full product launch.

## Who it is for

Flow is written for **solo founders and small technical teams** who want useful products, not just more code. You can use Flow with any stack; in this repository it ships alongside [Flow Starter](../readme.md), which already chose Next.js, React, TypeScript, and related foundations ([PDR 0001](../pdr/0001-agnostic-api-first.md)).

## Why Flow exists

Agents can implement quickly. That does not show the work is worth doing, that assumptions hold, or that decisions will survive the next session.

Flow helps you:

- Choose worthwhile work and name consequential uncertainty before investment grows.
- Turn accepted intent into bounded, verifiable implementation.
- Keep decisions in ordinary repository documents agents can read selectively.
- Use the least process that still reduces risk for the change at hand.

Flow does **not** guarantee faster delivery, quality, autonomous shipping, or product–market fit. Repository instructions encourage good behavior; they cannot force every model or tool to comply ([flow.md](flow.md)).

## Flow versus Flow Starter

|  | Flow | Flow Starter |
| --- | --- | --- |
| What it is | Methodology and document conventions | Opinionated technical starter |
| You define | Your product in `PRODUCT.md` and `DESIGN.md` | Which app you build on (`apps/web`, etc.) |
| Authority for workflow | [flow.md](flow.md) | Same; starter docs explain adoption |

The `apps/flow` demo application is not the methodology; it demonstrates GenUI and a read-only Flow Agent ([ADR 0012](../adr/0012-flow-and-web-applications.md)).

## Reading path

Start here, then go deeper as needed:

| Question | Page |
| --- | --- |
| How do I work day to day? | [working-with-flow.md](working-with-flow.md) |
| Why these practices and trade-offs? | [principles.md](principles.md) |
| Why these skills and what we learned from alternatives? | [influences-and-alternatives.md](influences-and-alternatives.md) |
| Where does intent live? | [project-context.md](project-context.md) |
| Customer learning vs correctness; evaluating Flow | [learning-and-improvement.md](learning-and-improvement.md) |

**Agents** route through [AGENTS.md](../../AGENTS.md). **Exact rules**—approvals, naming, skill selection—live only in [flow.md](flow.md). The pages above explain Flow for humans; they do not change those rules. Parallel work and delegation: [agents/delegation.md](../agents/delegation.md), [agents/worktrees.md](../agents/worktrees.md).

A feature idea and a broken sort field need different amounts of ceremony; [working-with-flow.md](working-with-flow.md) walks through both.

# Flow — Product development methodology

Flow is a lightweight way to build software with people and coding agents together. It connects exploration, product decisions, design, engineering, review, and delivery without treating every task like a full product launch.

## Who it is for

Flow is written for **solo founders and small technical teams** who want useful products, not just more code. You can use Flow with any stack; in this repository it ships inside [Flow Factory](factory.md), which provides an opinionated foundation (Next.js, React, TypeScript, and related tools—see [Factory PDR 0001](decisions/pdr/0001-agnostic-api-first.md)).

## Why Flow exists

Agents can implement quickly. That does not show the work is worth doing, that assumptions hold, or that decisions will survive the next session.

Flow helps you:

- Choose worthwhile work and name consequential uncertainty before investment grows.
- Turn accepted intent into bounded, verifiable implementation.
- Keep decisions in ordinary repository documents agents can read selectively.
- Use the least process that still reduces risk for the change at hand.

Flow does **not** guarantee faster delivery, quality, autonomous shipping, or product–market fit. Repository instructions encourage good behavior; they cannot force every model or tool to comply ([flow.md](flow.md)).

## Flow versus Flow Factory

|  | Flow | Flow Factory |
| --- | --- | --- |
| What it is | Methodology and document conventions | Agentic product-development environment |
| You define | Your product in `PRODUCT.md` and `DESIGN.md` | Which application you build (`apps/web`, etc.) |
| Authority for workflow | [flow.md](flow.md) | Same; [factory.md](factory.md) explains the foundation |

The **Flow app** (`apps/flow`) is not the methodology; it demonstrates GenUI and a read-only Flow Agent ([Factory ADR 0012](decisions/adr/0012-flow-and-web-applications.md)).

## Kinds of work

Flow uses one lifecycle for three everyday situations ([flow.md](flow.md#kinds-of-work)):

- **New product** — discovery, decisions, and a first useful slice.
- **Existing product** — features, fixes, and maintenance with proportional ceremony.
- **Flow improvement** — methodology and skills, via user-invoked `flow-improve`, not a second lifecycle.

Parallel execution, evaluation, and improvement are documented under [operations/](operations/); procedures live there and in [flow.md](flow.md), not in this introduction.

## Factory navigation

| Need | Location |
| --- | --- |
| Factory mission and adoption | [factory.md](factory.md) |
| Inherited technical architecture | [architecture.md](architecture.md) |
| Factory ADRs / PDRs | [decisions/adr/](decisions/adr/), [decisions/pdr/](decisions/pdr/) |
| GenUI specification | [specs/genui.md](specs/genui.md) |
| Security implementation model | [security/security-model.md](security/security-model.md) |
| Factory research and initiatives | [research/](research/), [initiatives/](initiatives/) |
| Operations (delegation, worktrees, verification) | [operations/](operations/) |

## Reading path

Start here, then go deeper as needed:

| Question | Page |
| --- | --- |
| How do I work day to day? | [working-with-flow.md](guides/working-with-flow.md) |
| Why these practices and trade-offs? | [principles.md](guides/principles.md) |
| Why these skills and what we learned from alternatives? | [influences.md](guides/influences.md) |
| Where does intent live? | [project-context.md](guides/project-context.md) |
| Customer learning vs correctness; evaluating Flow | [improvement.md](guides/improvement.md) |

**Agents** route through [AGENTS.md](../../AGENTS.md). **Exact rules**—approvals, naming, skill selection—live only in [flow.md](flow.md). The pages above explain Flow for humans; they do not change those rules. Parallel work and delegation: [delegation.md](operations/delegation.md), [worktrees.md](operations/worktrees.md).

A feature idea and a broken sort field need different amounts of ceremony; [working-with-flow.md](guides/working-with-flow.md) walks through both.

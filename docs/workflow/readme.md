# Flow — Product development methodology

Flow is a lightweight methodology for building software products with people and AI coding agents working together.

Its purpose is to connect exploration, product decisions, design, engineering, review, and delivery without unnecessary bureaucracy.

## Why Flow exists

Agents can write code quickly, but shipping faster does not guarantee you are solving the right problem.

You still need to understand user needs, preserve decisions, communicate intent, and verify outcomes.

Flow provides a way of working that helps:

- Shorten the distance between an idea and verifiable implementation.
- Surface uncertainty before building too much.
- Keep product and architecture decisions explicit.
- Give agents the context they need without loading all documentation.
- Work in small, useful increments.
- Avoid unnecessary abstractions, process, and documents.
- Keep product, design, code, and tests aligned.

## The workflow

**Explore → Specify → Plan → Build → Review → Ship**

The stages are activities, not a rigid sequence that must run in full for every change.

### Explore

Understand the problem, user needs, opportunities, and main uncertainties.

Research when the risk of a decision justifies it.

### Specify

Define the expected outcome, scope, constraints, and acceptance criteria.

Make clear what an implementation must achieve before you build it.

### Plan

Organize a viable, verifiable solution.

Identify dependencies, technical risks, and the smallest increment that delivers value.

### Build

Implement while respecting existing architectural decisions.

Keep code, tests, and relevant documentation in sync.

### Review

Verify quality and alignment between what was requested and what was built.

Review functionality, security, accessibility, maintainability, and observable outcomes.

### Ship

Deliver the agreed work and preserve evidence of what was done.

Communicate changes, tests run, and remaining limitations.

## Proportional process

Flow does not require six formal stages to fix a small bug.

A simple task can go directly through Build → Review → Ship.

An important product decision may need several Explore and Specify iterations.

The goal is to reduce uncertainty and deliver value, not to produce documentation by obligation.

## People and agents

People set intent, priorities, and decisions that need approval.

Agents help research, specify, plan, implement, test, and review.

Repository documents share context without depending on a single conversation.

Documentation should be useful, brief, and easy to navigate.

## Progressive documentation

Flow uses progressive disclosure: each agent reads only what the current task needs.

You do not need to read the entire repository before every change.

Each document has a clear responsibility.

- `AGENTS.md` routes agents.
- `PRODUCT.md` describes the product.
- `DESIGN.md` describes the experience.
- `ARCHITECTURE.md` describes technical architecture.
- `docs/adr/` holds architectural decisions.
- `docs/pdr/` holds product decisions.
- `docs/research/` holds research and evidence.
- `docs/specs/` holds detailed contracts when needed.
- `docs/initiatives/` can organize substantial work.
- `docs/plans/` allows standalone plans when truly justified.

Exact naming, dates, responsibilities, and skill selection belong in Flow's operational contract.

There is no need to duplicate them here.

## Skills

Flow uses specialized skills to support different activities.

A skill may help with research, validation, specifications, planning, implementation, testing, design, or review.

You do not need every skill on every task.

Choice depends on intent and the concrete needs of the work.

Substantial initiatives may fan out to git worktrees after planning; see [agents/worktrees.md](../agents/worktrees.md).

## Flow and Flow Starter

Flow is the working methodology.

[Flow Starter](../readme.md) provides an opinionated technical architecture that incorporates this methodology.

Flow can apply to other projects and technologies.

Flow Starter selects Next.js, React, and a specific agentic architecture so developers do not have to make those decisions from scratch.

## Technical reference

The operational contract for agents is:

[flow.md](flow.md)

That document is the source of truth for conventions, document responsibilities, skill selection, and workflow behavior.

Date: 2026-10-24

# ADR 0008 — Monorepo with Turborepo and pnpm

**Status:** Superseded by ADR 0001

## Context

Historical record. Monorepo tooling direction before consolidation into the foundational architecture decision.

## Decision

Use one monorepo with **pnpm workspaces**, **Turborepo** task orchestration, **apps/** for runnable applications, and **packages/** for shared libraries.

## Alternatives considered

Multiple repositories, a single app without workspace packages, and additional orchestration tools were evaluated in the superseded revision. Current layout and boundaries live in [ARCHITECTURE.md](../../../../ARCHITECTURE.md) and [ADR 0001](0001-agentic-architecture.md).

## Consequences

Superseded. Do not treat the old organization diagram in Git history as the current repository layout.

## Related documents

- [ADR 0001 — Agentic Architecture](0001-agentic-architecture.md)
- [ADR 0007 — Vercel-first platform](0007-monorepo-vercel-stack.md)
- [ARCHITECTURE.md](../../../../ARCHITECTURE.md)

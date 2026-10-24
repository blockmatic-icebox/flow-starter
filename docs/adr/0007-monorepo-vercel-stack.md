Date: 2026-10-24

# ADR 0007 — Vercel-first platform and AI infrastructure

**Status:** Superseded by ADR 0001

## Context

Historical record. Platform and AI provider direction for Flow Starter before consolidation into the foundational architecture decision.

## Decision

Use a **Vercel-first, standards-conscious technical baseline**: Next.js App Router with React, the Vercel AI SDK (and AI Gateway when configured) for optional model-backed features, and Vercel as the preferred deployment target when hosting is required.

## Alternatives considered

Other hosting providers and a mandatory provider-neutral platform abstraction were evaluated in the superseded revision. Current trade-offs live in [ADR 0001](0001-agentic-architecture.md).

## Consequences

Superseded. Do not treat this file as current implementation status or repository layout.

## Related documents

- [ADR 0001 — Agentic Architecture](0001-agentic-architecture.md)
- [ADR 0008 — Monorepo with Turborepo and pnpm](0008-monorepo-turborepo-pnpm.md)

Date: 2026-10-25

# ADR 0002 — Feature Intelligence architecture (assessment)

**Status:** Accepted

## Context

Meta CTO assessment requires an AI-first feature request workflow with human UI, measurable product metrics, and agent consumers—within a ~2–3 hour implementation slice on Flow Factory ([ADR 0001](./0001-use-flow-factory.md)).

## Decision

1. **`@repo/fi`** — product domain capabilities (triage harness, CRUD, metrics); no React.
2. **Triage harness** — lexical retrieve + deterministic theme fast-path + Jev `experimental_decide` + `generateObject` synthesis via **AI Gateway** ([spec](../specs/feature-intelligence-triage-harness.md), [ADR 0003](./0003-feature-intelligence-model-providers.md)).
3. **`apps/web`** — human FI routes + ask-only `/api/chat`; server actions call `@repo/fi` only.
4. **eve** — repository-root `agent/` with tools delegating to `@repo/fi`; integrated via `eve/next` (Node **24+** for eve runtime).
5. **Metrics-first** — timestamps and `getInsights` drive UX priorities ([spec](../specs/feature-intelligence.md#product-metrics-first)).
6. **MVP scope** — follow [initiative MVP cut line](../initiatives/feature-intelligence.md#mvp-cut-line-assessment); defer pgvector, full eve tool surface, and FI Playwright.

## Alternatives considered

- **Single `generateObject` triage** — simpler but weaker classification story and transparency for reviewers.
- **GenUI compose for triage UI** — rejected; FI uses structured cards, not OpenUI streams.
- **Chat as primary operator** — rejected; ask-only chat is secondary.

## Consequences

- Product code spans `packages/fi`, `packages/db` migrations, `apps/web`, and `agent/`.
- CI runs `@repo/fi` unit/harness tests; FI browser tests remain manual for MVP.
- Eve and web share identical triage outcomes for the same input.

## Related documents

- [docs/initiatives/feature-intelligence.md](../initiatives/feature-intelligence.md)
- [docs/specs/feature-intelligence.md](../specs/feature-intelligence.md) (spec index)
- [docs/specs/feature-intelligence-journeys.md](../specs/feature-intelligence-journeys.md)
- [docs/specs/feature-intelligence-ai-ux-patterns.md](../specs/feature-intelligence-ai-ux-patterns.md)
- [docs/specs/feature-intelligence-eve-agent.md](../specs/feature-intelligence-eve-agent.md)
- [Factory PDR 0001](../../.agents/flow/decisions/pdr/0001-agnostic-api-first.md)

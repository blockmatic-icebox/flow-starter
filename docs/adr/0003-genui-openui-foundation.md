Date: 2026-10-24

# ADR 0003 — GenUI foundation uses OpenUI Lang

**Status:** Accepted

## Context

Flow’s roadmap referenced json-render for early canvas specs. The extraction source already shipped a production **select → compile → render** GenUI stack on OpenUI Lang (`@openuidev/lang-core`, `@openuidev/react-lang`), shared compiler validation, NDJSON compose streaming, and MCP Apps host patterns.

This extraction task generalizes that architecture for adopters without copying portfolio data or site routes.

## Decision

- Add `@repo/genui` as the portable GenUI package: domain contracts, OpenUI compiler, orchestration tiers, action registry, eval matrix, and React host adapter.
- Keep json-render as documented research and a possible future canvas adapter; do not run two parallel composition languages in the starter demo.
- Use the existing OpenUI Lang contract as the initial validated representation; do not maintain a parallel json-render compiler for the same starter experience.
- Use fictional **Acme Analytics** fixtures in Flow Starter examples and evaluations.

## Alternatives considered

- **json-render as the primary contract.** Rejected for the initial foundation; see [comparative research](../research/20261024-genui-json-vs-openui.md).
- **Dual compilers in the demo.** Rejected; one primary GenUI contract reduces maintenance and agent confusion.

## Consequences

- Apps import `@repo/genui` for compose/validate APIs and `@repo/genui/react` for rendering.
- Tier 1–2 paths are deterministic and testable without model credentials. Tier 3 supports optional model-backed prose inside the validated Answer experience ([ADR 0002](0002-vercel-ai-sdk-for-tier-3.md)).
- Fully open-ended component-tree planning, Eve tool wiring, and additional host integrations remain follow-on work.

## Related documents

- [docs/specs/genui.md](../specs/genui.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [docs/research/20261020-generative-ui.md](../research/20261020-generative-ui.md)
- [docs/research/20261024-genui-json-vs-openui.md](../research/20261024-genui-json-vs-openui.md)

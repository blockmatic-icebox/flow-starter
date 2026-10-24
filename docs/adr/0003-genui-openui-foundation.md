Date: 2026-10-24

# ADR 003 — GenUI foundation uses OpenUI Lang

**Status:** Accepted · October 24, 2026

## Context

Flow’s roadmap referenced json-render for early canvas specs. The extraction source already shipped a production **select → compile → render** GenUI stack on OpenUI Lang (`@openuidev/lang-core`, `@openuidev/react-lang`), shared compiler validation, NDJSON compose streaming, and MCP Apps host patterns.

This extraction task generalizes that architecture for adopters without copying portfolio data or site routes.

## Decision

- Add `@repo/genui` as the portable GenUI package: domain contracts, OpenUI compiler, orchestration tiers, action registry, eval matrix, and React host adapter.
- Keep json-render as documented research and a possible future canvas adapter; do not run two parallel composition languages in the starter demo.
- Use the existing OpenUI Lang contract as the initial validated representation; do not maintain a parallel json-render compiler for the same starter experience. The [comparative research](../research/20261024-genui-json-vs-openui.md) documents the trade-offs without claiming one framework is inherently safer.
- Use fictional **Acme Analytics** fixtures in Flow Starter examples and evaluations.

## Consequences

- Apps import `@repo/genui` for compose/validate APIs and `@repo/genui/react` for rendering.
- Tier 1–2 paths are deterministic and testable without model credentials. Tier 3 currently supports optional model-backed prose inside the validated Answer experience. Fully open-ended component-tree planning, Eve tool wiring, and additional host integrations remain follow-on work.
- ARCHITECTURE.md generative presentation language names OpenUI Lang as the initial implemented contract.

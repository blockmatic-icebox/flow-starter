# ADR 0005 — GenUI foundation uses OpenUI Lang

**Status:** Accepted · October 24, 2026

## Context

Flow’s roadmap referenced json-render for early canvas specs. gaboesquivel.com already ships a production **select → compile → render** GenUI stack on OpenUI Lang (`@openuidev/lang-core`, `@openuidev/react-lang`), shared compiler validation, NDJSON compose streaming, and MCP Apps host patterns.

This extraction task generalizes that architecture for adopters without copying portfolio data or site routes.

## Decision

- Add `@repo/genui` as the portable GenUI package: domain contracts, OpenUI compiler, orchestration tiers, action registry, eval matrix, and React host adapter.
- Keep json-render as documented research and a possible future canvas adapter; do not run two parallel composition languages in the starter demo.
- Use fictional **Acme Analytics** fixtures in Flow Starter examples and evaluations.

## Consequences

- Apps import `@repo/genui` for compose/validate APIs and `@repo/genui/react` for rendering.
- Model-backed tier-3 composition and eve tool wiring remain follow-on work; tier 1–2 paths are deterministic and testable today.
- ARCHITECTURE.md generative presentation language is updated to name OpenUI Lang as the initial implemented contract.

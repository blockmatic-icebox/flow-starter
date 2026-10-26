Date: 2026-10-24

# ADR 0001 — Use Flow Factory

**Status:** Accepted

## Context

A new software product benefits from an established development methodology, architecture, tooling, documentation conventions, and tested engineering defaults. Repeatedly selecting the same technical foundation creates unnecessary decision overhead.

This starter repository ships as a product template on top of Flow Factory. The Factory already records stack, GenUI, agent, and security rationale under `.agents/flow/`. The product needs a single explicit adoption decision without copying that history into product documentation.

## Decision

Adopt Flow Factory as the engineering foundation for this product.

The product inherits Flow's technical architecture, quality practices, and documentation conventions. Factory-owned rationale and decisions remain canonical under `.agents/flow/`. Product-specific decisions remain under `docs/` and root contracts (`PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`).

The lean agentic starter on **`main`** (merged from `simple`, PR #8) uses day-to-day workflow [ADR 0002](0002-matt-workflow-on-simple.md), not the Factory phase router. Branch **`meta-cto`** keeps the assessment product and its process.

The product may intentionally diverge from an inherited architectural choice through an explicit, accepted product ADR that references the relevant Factory ADR. Such a decision applies to this product and does not rewrite Factory history.

## Alternatives considered

**Build workflow and architecture independently.** Maximizes freedom but repeats decisions the Factory already made (monorepo layout, GenUI boundaries, agent tooling, verification gates) and increases agent context load.

**Adopt isolated tools without the coherent Factory foundation.** Could pick individual libraries, but loses aligned documentation, skills, evaluation harnesses, and the operational contract in `.agents/flow/flow.md`.

Neither alternative was selected because this repository is intentionally a Flow Factory starter.

## Consequences

- Product documentation starts with this adoption ADR; Factory ADRs are not duplicated under `docs/adr/`.
- Factory improvements and technical decisions stay in `.agents/flow/`.
- New product ADRs (from `0002` onward) record product-specific choices or intentional divergences.
- Agents should read product contracts and implementation first; load Factory ADRs only when touching inherited boundaries.
- Replacing inherited stack choices (database, auth, monorepo) requires human approval and a product ADR, not edits to Factory records.

## Related documents

- [.agents/flow/factory.md](../../.agents/flow/factory.md)
- [.agents/flow/flow.md](../../.agents/flow/flow.md)
- [.agents/flow/architecture.md](../../.agents/flow/architecture.md)
- [Factory ADRs](../../.agents/flow/decisions/adr/)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)

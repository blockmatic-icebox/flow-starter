# PDR 0001 — Platform-agnostic, API-first development approach

**Status:** Proposed · October 24, 2026

## Context

The system is a template for future projects (“starter”). We aim for it to be **product-agnostic** and support multiple channels (web, voice, APIs, agents). Early decisions should reflect that priority.

## Decision

Adopt an **API-first**, multi-channel, and agent-centric design. We will:

- Expose all functionality via HTTP APIs as the primary interface.
- Treat any user interface (web UI, GenUI authoring, voice, etc.) as interchangeable clients of these APIs.
- Emphasize **agent compatibility**: ensure data and results are consumable by AI agents and chat interfaces.
- Design with database-agnostic data models and environment-agnostic deployment, so adopters can easily integrate their own components.

## Consequences

- The codebase avoids hard-coding any single product UI or workflow.
- Product logic resides in backend services or composable functions, not in one web frontend.
- New channels can be added by writing new frontends or agents on top of the same APIs.
- We must invest effort in clear API schemas and comprehensive tests for backend logic.

## Alternatives considered

- **Fixed single-page app with embedded logic** — rejected as too rigid.
- **Web app as the main source of truth** — inverted in our chosen approach; APIs and shared actions own behavior.

## Related documents

- [PRODUCT.md](../../PRODUCT.md) — product contract and platform stance
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — API surface and integration boundaries
- [ADR 006](../adr/006-external-invocation-is-read-only.md) — external read-only invocation

Date: 2026-10-24

# ADR 0005 — Workspace interactions stay at `/dev`

**Status:** Accepted

## Context

**Not implemented.** The starter keeps a neutral marketing or app shell at `/` while adopters build an agent workspace. Shareable URLs for generated artifacts can imply published product state.

## Decision

All workspace generation, chat, canvas updates, and voice stay on one route (`/dev`). Conversation and artifact identifiers are internal, not shareable page URLs. That keeps the adopter’s app at `/` separate and avoids generated routes that look like published products.

## Alternatives considered

- **Workspace at `/` in the product app.** Rejected for the starter pattern; adopters own `/` in `apps/web`.
- **Shareable artifact URLs before publication workflow exists.** Rejected; risks implying shipped product state.

## Consequences

- Scope and journeys belong in [PRODUCT.md](../../PRODUCT.md) once the workspace ships.
- The Flow experience sidebar ([ADR 0010](0010-site-consultant-chat-and-mcp.md)) is not the `/dev` workspace.

## Related documents

- [ADR 0010 — Flow Agent chat and MCP](0010-site-consultant-chat-and-mcp.md)
- [ADR 0012 — Flow and web applications](0012-flow-and-web-applications.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md) §7

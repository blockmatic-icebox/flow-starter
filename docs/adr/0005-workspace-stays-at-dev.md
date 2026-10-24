Date: 2026-10-24

# ADR 005 — Workspace interactions stay at `/dev`

**Status:** Accepted

## Context

The starter keeps a neutral marketing or app shell at `/` while adopters build an agent workspace. Shareable URLs for generated artifacts can imply published product state.

## Decision

All workspace generation, chat, canvas updates, and voice stay on one route (`/dev`). Conversation and artifact identifiers are internal, not shareable page URLs. That keeps the adopter’s app at `/` separate and avoids generated routes that look like published products.

## Consequences

- Scope and journeys belong in [PRODUCT.md](../../PRODUCT.md) once the workspace ships.
- The public site shell may include a consultant chat sidebar on all routes ([ADR 0010](0010-site-consultant-chat-and-mcp.md)); that is not the `/dev` workspace.

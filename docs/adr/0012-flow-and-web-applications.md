Date: 2026-10-24

# ADR 0012 — Flow application and product web split

**Status:** Accepted

## Context

Flow Starter previously shipped a single `apps/web` package that mixed a product template, Generative UI demo, site consultant chat, and MCP endpoints. ADR 0009 described feature-first folders, which separated route code from closely related implementation.

## Decision

1. **`apps/web`** is the product-neutral Next.js starter (minimal homepage, shared UI, optional database).
2. **`apps/flow`** (`flow-app` package) is the Flow experience: GenUI at `/`, Flow Agent sidebar, fixture lab, and compose/chat/MCP APIs.
3. **Route-first colocation** replaces mandatory `features/` directories. Extract shared code only when reuse or a boundary justifies it (AHA).
4. **Flow Agent** replaces the site consultant. Knowledge is bundled from approved repository documents at build time; MCP exposes a subset of read-only tools.
5. **Better Auth** core tables are generated in `@repo/db` without shipping login UI or protected routes.

## Alternatives considered

- **Keep demo routes in `apps/web`.** Rejected; adopters should fork a product-neutral app without inheriting Flow demos.
- **Mandatory `features/` layer.** Rejected; route-first colocation per [ADR 0009](0009-react-nextjs-fractal-architecture.md).

## Consequences

- Adopters fork `apps/web` without inheriting demo agents or GenUI routes.
- CI and workspace scripts build and test both applications independently.
- Historical ADRs referencing `/genui-demo` and `features/` describe the pre-split layout; current guidance lives in [ARCHITECTURE.md](../../ARCHITECTURE.md) and [ADR 0009](0009-react-nextjs-fractal-architecture.md).

## Related documents

- [ADR 0009 — React and Next.js Fractal Architecture](0009-react-nextjs-fractal-architecture.md)
- [ADR 0010 — Flow Agent chat and MCP](0010-site-consultant-chat-and-mcp.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)

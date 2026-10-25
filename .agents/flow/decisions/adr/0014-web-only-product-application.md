Date: 2026-10-24

# ADR 0014 — Web-only product application

**Status:** Accepted

## Context

Flow Factory reorganized so the repository root represents the **product** and `.agents/` represents the **Factory**. A separate Flow demonstration application mixed Factory UX (Flow Agent, GenUI demo shell, fixture lab) with product concerns and duplicated ownership of GenUI integration patterns.

## Decision

1. **`apps/web` is the only product application** in this starter template.
2. **Remove the Flow demonstration application** from the template. GenUI runtime remains in `@repo/genui`; adopters integrate it in product routes when needed.
3. **Factory evaluation and orchestration** live under `.agents/eval` and `.agents/tooling`, not under `packages/` or a second application.
4. Historical Flow Agent, MCP demo, and knowledge-snapshot bundling described in [ADR 0010](0010-site-consultant-chat-and-mcp.md) and [ADR 0012](0012-flow-and-web-applications.md) remain valid **historical** decisions; they are not current deployment targets for this layout.

## Alternatives considered

- **Keep a second demo application.** Rejected; adopters should fork a single product app without inheriting Factory demonstration UI.
- **Move the demo under `.agents/`.** Rejected; Factory must evaluate the product, not ship a parallel application runtime.

## Consequences

- Product adopters fork and extend `apps/web` only.
- Factory documentation and evaluation reference `.agents/` paths.
- Deploy **`web`** as a single Vercel project with Root Directory `apps/web`.
- GenUI specification and security boundaries still apply at the package and product-integration layer.

## Related documents

- [Factory architecture](../../architecture.md)
- [Product ARCHITECTURE.md](../../../../ARCHITECTURE.md)
- [ADR 0012](0012-flow-and-web-applications.md) (superseded)

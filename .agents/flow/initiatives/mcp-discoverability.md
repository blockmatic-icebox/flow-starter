Date: 2026-10-26

# Initiative — MCP and agent discoverability (Flow Factory)

**Status:** Proposed  
**Stage:** Explore  
**Scope:** Flow Factory starter and methodology — **not** Feature Intelligence product work

## Outcome

Adopters of Flow Factory can make a **neutral** `apps/web` deployment discoverable by external agents and MCP hosts using documented, reusable patterns: well-known metadata, optional Streamable HTTP MCP, `llms.txt`, sitemap, Markdown negotiation, and **Is Agentic** verification—without copying the Meta CTO assessment product (Feature Intelligence stays unchanged on branch `meta-cto`).

## Problem

- External agents cannot infer **what** a starter deployment is, **when** to use it, or **how** to call it without standard surfaces (`llms.txt`, `/.well-known/mcp/*`, `POST /api/mcp`).
- Factory already documents security boundaries ([ADR 0011](../decisions/adr/0011-api-and-agent-security-boundaries.md)) and historical Flow Agent MCP shape ([ADR 0010](../decisions/adr/0010-site-consultant-chat-and-mcp.md)), but the **current** `apps/web` starter does not ship a complete discoverability kit by default.
- Assessment-specific agentic work on FI (product ADR 0005 on `meta-cto`) must not be conflated with the **reusable baseline** every adopter needs.

## Users

| User | Job |
| --- | --- |
| **Adopter engineer** | Enable MCP + discovery on their product host with Factory defaults and security gates |
| **Agent / MCP host** | Discover tools and instructions on the same origin as the web app |
| **Factory maintainer** | Keep starter docs, scripts, and examples aligned with Is Agentic essential checks |

## Decided

- **FI boundary:** No changes to Feature Intelligence initiatives, specs, tasks, or `meta-cto` product code as part of this initiative unless explicitly re-scoped later.
- **Verification hook (shipped on `main`):** Root `pnpm agentic:check` with `AGENTIC_CHECK_URL` and [.agents/flow/operations/verification.md](../operations/verification.md) optional gate (`is-agentic` devDependency).
- **Security default:** Public MCP on adopters follows [ADR 0011](../decisions/adr/0011-api-and-agent-security-boundaries.md)—read-only or authenticated mutations; no assessment-style open write tools in the neutral starter template.
- **Transport:** Prefer **Streamable HTTP** MCP on `POST /api/mcp` when a product ships MCP; discovery via `/.well-known/mcp/server-card.json` and registry manifest patterns per public specs (VerifyMCP / Is Agentic).

## Assumed

- Discoverability targets a **public HTTPS origin** (preview or production); local `localhost` is for dev only and is not an Is Agentic target without a tunnel.
- Next.js **middleware** may conflict with Eve on Vercel Services; Factory guidance will document route-handler and `next.config` rewrite patterns before recommending middleware.
- Is Agentic reports are **cached**; adopters must **Rescan** after deploy before trusting `pnpm agentic:check` scores.

## Open

- **Delivery shape:** Documentation-only kit vs optional scaffold routes under `apps/web` (feature-flagged or template package).
- **MCP tool surface for starter:** Read-only “describe stack” tools (ADR 0010 lineage) vs domain tools owned by the product package.
- **Factory ADR:** Whether to accept a new Factory ADR for neutral starter discoverability or extend ADR 0010 / 0011 prose only.
- **CI:** Optional `agentic:check` in `ci:factory:local` vs manual preview gate.

## Non-goals

- Extending or re-verifying Feature Intelligence agentic acceptance (AD-1–AD-7) on `meta-cto-two.vercel.app`.
- Smithery/registry publishing, OAuth for MCP, or multi-tenant MCP routing.
- Replacing Eve as the in-repo agent runtime for products that adopt Eve.

## Related documents

| Document | Role |
| --- | --- |
| [ADR 0010](../decisions/adr/0010-site-consultant-chat-and-mcp.md) | Historical Flow Agent chat + read-only MCP |
| [ADR 0011](../decisions/adr/0011-api-and-agent-security-boundaries.md) | Public API and MCP boundaries |
| [ADR 0006](../decisions/adr/0006-external-invocation-is-read-only.md) | External invocation read-only default |
| [verification.md](../operations/verification.md) | Is Agentic optional deploy gate |
| [factory.md](../factory.md) | Factory mission and starter scope |
| [ADR 0014](../decisions/adr/0014-web-only-product-application.md) | Web-only product application |
| [flow-improvement-loop.md](flow-improvement-loop.md) | Methodology evidence loop (factory tooling promotions) |
| FI (unchanged) | Feature Intelligence docs on branch `meta-cto` only — product assessment, not this starter |

## Progress

- [x] Explore — problem and FI boundary stated (this record)
- [ ] Specify — Factory spec or ADR for neutral starter discoverability (human approval for contract paths)
- [ ] Plan — `docs/tasks/` or `.agents/flow/specs/` checklist when scope is chosen
- [ ] Build — **not authorized**
- [ ] Review / Ship

## Next step

Human **Specify** approval: choose delivery shape (docs-only vs starter scaffold) and whether a Factory ADR is required before any `apps/web` neutral routes ship on `main`.

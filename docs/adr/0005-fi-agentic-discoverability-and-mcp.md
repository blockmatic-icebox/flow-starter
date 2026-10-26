Date: 2026-10-26

# ADR 0005 — Feature Intelligence agentic discoverability and public MCP

**Status:** Proposed

## Context

Feature Intelligence already exposes **human UI**, **ask-only chat**, and **Eve** tools over `@repo/fi` ([ADR 0002](./0002-feature-intelligence-architecture.md)). External agents (ChatGPT, Claude, Cursor, custom MCP hosts) cannot discover or call those capabilities without a **standard interoperability surface**.

An [Is Agentic](https://is-agentic.com/docs) audit of production (`meta-cto-two.vercel.app`, 2026-10-26) scored **59/100**, with essential gaps in **Markdown negotiation**, **agent instruction files**, and **live MCP handshake** (registry partial credit only; **`/.well-known/mcp` missing**).

[ADR 0004](./0004-fi-workflow-integrity-and-safety.md) deferred a separate FI MCP product server for the remediation slice. This ADR **adds** a deliberate MCP + discoverability layer for the assessment demo without replacing Eve as the primary in-repo agent.

Factory patterns apply: read-only external invocation ([Factory ADR 0006](../../.agents/flow/decisions/adr/0006-external-invocation-is-read-only.md)), HTTP/MCP as untrusted boundaries ([Factory ADR 0011](../../.agents/flow/decisions/adr/0011-api-and-agent-security-boundaries.md)), historical Flow MCP shape ([Factory ADR 0010](../../.agents/flow/decisions/adr/0010-site-consultant-chat-and-mcp.md)).

## Decision

1. **Discoverability package** — Ship machine-readable agent docs on the **same origin** as the web app: `llms.txt` (with when-to-use), `sitemap.xml`, JSON-LD on the homepage, Markdown negotiation (`Accept: text/markdown`) + `Vary: Accept` on key routes, and agent-friendly Markdown 404 bodies.
2. **Public MCP (Streamable HTTP)** — Expose `POST /api/mcp` (or `/mcp` alias) using **Streamable HTTP** transport so Claude Desktop, ChatGPT connectors, and other MCP clients can connect with `{ "type": "http", "url": "https://<host>/api/mcp" }`.
3. **Discovery metadata** — Publish:
   - `/.well-known/mcp/server-card.json` (canonical server card: transport, endpoint, tools, auth),
   - `/.well-known/mcp.json` (registry-style manifest pointer per [verifymcp discovery guidance](https://verifymcp.io/docs/remote/discovery)),
   - optional `/.well-known/ai-catalog.json` listing the FI MCP server.
4. **Tool policy (phased)**  
   - **Phase A (public, read-only):** `search_requests`, `get_request`, `list_triage_queue`, `get_insights` — same semantics as Eve read tools; no mutations.  
   - **Phase B (assessment demo, optional bearer):** `set_disposition`, `submit_request`, `confirm_request`, `support_request` only when `FI_MCP_BEARER_TOKEN` (or similar) is configured; otherwise tools are omitted from the public card.
5. **Single domain layer** — MCP tool handlers call **`@repo/fi` only** (no duplicate business logic). Eve and MCP share validation with web server actions.
6. **Verification** — Add `is-agentic` CLI (`npx is-agentic <host>`) as an optional CI/preview check; target **essential checks passing** and **MCP check full** (live handshake + well-known) before claiming “agent-ready.”
7. **Assessment auth** — Remains **no end-user login**; MCP Phase A is intentionally unauthenticated read-only on the public demo URL. Production hardening (OAuth, rate limits, Redis) follows Factory ADR 0011 when moving beyond the assessment.

## Alternatives considered

- **Eve HTTP only (no MCP)** — Rejected for discoverability goal; ChatGPT/Claude native MCP hosts do not consume Eve sessions.
- **stdio MCP only** — Rejected; not reachable from remote cloud agents without a bridge.
- **Full mutation MCP without auth** — Rejected; conflicts with security model and assessment scope.
- **Rely on Smithery/registry alone** — Insufficient; Is Agentic requires **live protocol handshake** on our origin.

## Consequences

- New routes and middleware in `apps/web`; possible `packages/mcp-fi` or colocated `apps/web/app/api/mcp` module.
- [feature-intelligence-eve-agent.md](../specs/feature-intelligence-eve-agent.md) MCP row superseded by [agentic discoverability spec](../specs/feature-intelligence-agentic-discoverability.md).
- Deployment must expose MCP on the **production alias** (not only preview); Vercel Deployment Protection may block external auditors—document bypass or public alias policy.
- `pnpm agentic:check` (script) runs `is-agentic` against configured URL in CI optional job.

## Related documents

- [docs/specs/feature-intelligence-agentic-discoverability.md](../specs/feature-intelligence-agentic-discoverability.md)
- [docs/tasks/feature-intelligence-agentic-discoverability.md](../tasks/feature-intelligence-agentic-discoverability.md)
- [ADR 0004](./0004-fi-workflow-integrity-and-safety.md)
- [SECURITY.md](../../SECURITY.md)

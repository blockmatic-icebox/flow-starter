# Spec: Feature Intelligence — agentic discoverability (Is Agentic + MCP)

**Last reviewed:** 2026-10-26  
**Status:** Draft  
**ADR:** [0005](../adr/0005-fi-agentic-discoverability-and-mcp.md) (Proposed)  
**Initiative:** [feature-intelligence.md](../initiatives/feature-intelligence.md)

## Problem

Agents and MCP hosts cannot discover **what** Feature Intelligence is, **when** to use it, or **how** to call it on our domain. Eve tools exist for in-repo agents but are not advertised via standard discovery or Streamable HTTP MCP.

## Outcome

Any standard agent client (Claude, ChatGPT, Cursor, etc.) can:

1. Find **instructions** (`llms.txt`, when-to-use, sitemap).
2. Read the **homepage and errors** as Markdown when requested.
3. Discover MCP via **well-known** documents.
4. Complete an MCP **Streamable HTTP** handshake and invoke **read-only** FI tools against production.

## Non-goals

- End-user OAuth for the assessment demo (Phase B uses optional static bearer only).
- Replacing Eve as the primary PM copilot.
- MCP tools that bypass `@repo/fi` validation.
- Writable MCP on the public internet without `FI_MCP_BEARER_TOKEN`.

---

## Surfaces

| Surface | Path | Consumer |
| --- | --- | --- |
| Agent instructions | `/llms.txt` | Crawlers, ChatGPT, Claude |
| AI catalog | `/.well-known/ai-catalog.json` | Agent discovery |
| MCP server card | `/.well-known/mcp/server-card.json` | MCP clients |
| Registry manifest | `/.well-known/mcp.json` | Directories, Is Agentic |
| MCP transport | `POST /api/mcp` (+ `GET /api/mcp/server-card` if required by SDK) | Streamable HTTP clients |
| Eve (existing) | `/eve/v1/...` | Eve-native hosts |

**Canonical production host:** `https://meta-cto-two.vercel.app` (or project primary alias). Docs and well-known URLs must use the **same host** clients connect to.

---

## MCP tools

### Phase A — public read-only (required)

| Tool | Maps to `@repo/fi` | Notes |
| --- | --- | --- |
| `search_requests` | `searchRequests` | Pagination + `q` documented in tool description |
| `get_request` | `getRequest` | |
| `list_triage_queue` | `listTriageQueue` | |
| `get_insights` | `getInsights` | Optional `range` |

### Phase B — mutation (optional bearer)

Same names as [Eve tools](./feature-intelligence-eve-agent.md); registered only when `FI_MCP_BEARER_TOKEN` is set. Requests must send `Authorization: Bearer <token>`.

---

## Discoverability content

### `llms.txt` (required)

- Product name, one-paragraph summary, link to `/requests`, `/triage`, `/insights`.
- **When to use this product** section (Is Agentic `agent-instruction` check).
- Link to MCP: `/.well-known/mcp/server-card.json` and `/api/mcp`.
- Link to human docs: `PRODUCT.md` concepts in plain language (not raw repo paths on prod—use on-site copy).

### Homepage (required for Is Agentic essential tier)

- ≥500 characters meaningful text in **initial HTML** (SSR or static), clear H1.
- JSON-LD (`SoftwareApplication` or `WebApplication`) with name, description, url.
- `Accept: text/markdown` returns Markdown body; `Accept: text/html` returns HTML; response includes `Vary: Accept`.

### 404 (required)

- HTTP 404 preserved.
- When `Accept: text/markdown`, body is Markdown (≥20 chars) with link to `llms.txt` or sitemap.

### Sitemap (required)

- `/sitemap.xml` listing FI routes: `/`, `/requests`, `/triage`, `/insights`, `/requests/new`, `/chat`.

---

## Server card (minimum shape)

```json
{
  "version": "1.0",
  "serverInfo": {
    "name": "feature-intelligence",
    "title": "Feature Intelligence",
    "version": "1.0.0"
  },
  "description": "Search feature requests, triage queue, and product insights for Meta CTO Feature Intelligence.",
  "transport": {
    "type": "streamable-http",
    "endpoint": "https://<host>/api/mcp"
  },
  "tools": [
    { "name": "search_requests", "description": "Search published requests with pagination." }
  ],
  "authentication": { "required": false }
}
```

Phase B: set `authentication.required: true` and document bearer in card when mutations are enabled.

---

## Security

- Rate limit `/api/mcp` (in-memory dev; Vercel firewall or Upstash in production per Factory security model).
- Validate JSON-RPC / MCP message size limits.
- Never expose `DATABASE_URL` or model keys via MCP resources.
- Log tool errors without leaking stack traces to clients.

---

## Verification

### Is Agentic (target)

Run from repo:

```sh
npx is-agentic@latest <production-host> --json
```

| Check id | Target |
| --- | --- |
| `mcp-server` | **pass** (live handshake + `/.well-known/mcp`) |
| `markdown-negotiation-vary` | **pass** |
| `agent-instruction` | **pass** |
| `sitemap` | **pass** |
| `agent-friendly-404` | **pass** |
| `content-no-js` | **pass** or partial acceptable |

Add root script: `"agentic:check": "is-agentic ${AGENTIC_CHECK_URL:-meta-cto-two.vercel.app}"` (devDependency `is-agentic`).

### Automated

- Integration tests: `GET /.well-known/mcp/server-card.json` 200; MCP initialize + `tools/list` smoke against local `next dev`.
- Eve evals remain separate; MCP tests assert **HTTP transport** and **DB read outcomes**.

### Manual

- Claude Desktop / ChatGPT: add remote MCP URL, list tools, call `search_requests` with `query: "CSV"`.
- `curl -H 'Accept: text/markdown' https://<host>/`

---

## Acceptance criteria

| ID | Criterion |
| --- | --- |
| AD-1 | `/.well-known/mcp/server-card.json` valid; endpoint matches live `/api/mcp`. |
| AD-2 | Streamable HTTP MCP handshake succeeds from `npx @modelcontextprotocol/inspector` or documented client. |
| AD-3 | Phase A tools return same data as Eve for equivalent inputs (CSV search smoke). |
| AD-4 | `llms.txt` includes when-to-use + MCP link. |
| AD-5 | Homepage Markdown negotiation passes Is Agentic `markdown-negotiation-vary`. |
| AD-6 | `npx is-agentic <host>` MCP check **pass** (not partial). |
| AD-7 | Phase B mutations disabled on public deploy unless bearer configured. |

---

## Approval

**Draft** — pending human approval of [ADR 0005](../adr/0005-fi-agentic-discoverability-and-mcp.md). **Build** requires explicit authorization after [tasks](../tasks/feature-intelligence-agentic-discoverability.md) Plan approval.

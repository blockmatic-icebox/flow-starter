# Spec: Feature Intelligence — agentic discoverability (Is Agentic + MCP)

**Last reviewed:** 2026-10-26  
**Status:** Current  
**Implementation:** Shipped on `meta-cto` (`meta-cto-two.vercel.app`); Is Agentic score claim pending fresh scan ([verification log](../research/20261026-fi-agentic-verification.md))  
**ADR:** [0005](../adr/0005-fi-agentic-discoverability-and-mcp.md) (Accepted)  
**Initiative:** [feature-intelligence.md](../initiatives/feature-intelligence.md)  
**Factory (separate):** Neutral starter MCP discoverability — [.agents/flow/initiatives/mcp-discoverability.md](../../.agents/flow/initiatives/mcp-discoverability.md) (does not extend this product spec)

**MCP App (planned):** Interactive UI resource and tool associations — [hunch-mcp-app.md](./hunch-mcp-app.md) (extends this transport; eight tools unchanged).

## Problem

Agents and MCP hosts cannot discover **what** Feature Intelligence is, **when** to use it, or **how** to call it on our domain. Eve tools exist for in-repo agents but are not advertised via standard discovery or Streamable HTTP MCP.

## Outcome

Any standard agent client (Claude, ChatGPT, Cursor, etc.) can:

1. Find **instructions** (`llms.txt`, when-to-use, sitemap).
2. Read the **homepage and errors** as Markdown when requested.
3. Discover MCP via **well-known** documents.
4. Complete an MCP **Streamable HTTP** handshake and invoke FI tools (read and write on the assessment demo host).

## Non-goals

- End-user OAuth for the assessment demo.
- Replacing Eve as the primary PM copilot.
- MCP tools that bypass `@repo/fi` validation.
- Writable MCP on the public internet for production adopters without Factory ADR 0011 hardening (assessment demo is explicitly open).

---

## Surfaces

| Surface | Path | Consumer |
| --- | --- | --- |
| Agent instructions | `/llms.txt` | Crawlers, ChatGPT, Claude |
| AI catalog | `/.well-known/ai-catalog.json` | Agent discovery |
| MCP server card | `/.well-known/mcp/server-card.json` | MCP clients |
| Registry manifest | `/.well-known/mcp.json` | Directories, Is Agentic |
| MCP transport | `POST /api/mcp` (canonical); `POST /mcp` convenience alias (same handler) | Streamable HTTP clients |
| Eve (existing) | `/eve/v1/...` | Eve-native hosts |

**Canonical production host:** `https://meta-cto-two.vercel.app` (or project primary alias). Docs and well-known URLs must use the **same host** clients connect to.

---

## MCP tools

### Phase A — public read-only (required)

| Tool | Maps to `@repo/fi` | Notes |
| --- | --- | --- |
| `search_requests` | `searchRequests` | Pagination + `q` documented in tool description |
| `get_request` | `getRequest` |  |
| `list_triage_queue` | `listTriageQueue` |  |
| `get_insights` | `getInsights` | Optional `range` |

### Assessment demo — mutation tools (open)

Same names as [Eve tools](./feature-intelligence-eve-agent.md); registered on public `/api/mcp` without bearer for the Meta CTO assessment (`FI_MCP_DEMO_OPEN=1` default on assessment deploy). Production forks must gate mutations behind auth per Factory ADR 0011.

| Tool              | Maps to `@repo/fi`     |
| ----------------- | ---------------------- |
| `submit_request`  | `createDraftAndTriage` |
| `confirm_request` | `confirmRequest`       |
| `support_request` | `supportRequest`       |
| `set_disposition` | `setDisposition`       |

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
    {
      "name": "search_requests",
      "description": "Search published requests with pagination."
    }
  ],
  "authentication": { "required": false }
}
```

Assessment demo: `authentication.required: false` with all tools listed; production adopters set `required: true` when enabling bearer/OAuth.

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

| Check id                    | Target                                         |
| --------------------------- | ---------------------------------------------- |
| `mcp-server`                | **pass** (live handshake + `/.well-known/mcp`) |
| `markdown-negotiation-vary` | **pass**                                       |
| `agent-instruction`         | **pass**                                       |
| `sitemap`                   | **pass**                                       |
| `agent-friendly-404`        | **pass**                                       |
| `content-no-js`             | **pass** or partial acceptable                 |

On the assessment branch, root script: `"agentic:check": "is-agentic ${AGENTIC_CHECK_URL:-meta-cto-two.vercel.app}"` (`is-agentic` devDependency). On Factory `main`, `AGENTIC_CHECK_URL` is required (see [.agents/flow/operations/verification.md](../../.agents/flow/operations/verification.md)).

**Cache:** `pnpm agentic:check` returns the latest stored report; it does not force a rescan. After deploy, use **Rescan** on the [report page](https://is-agentic.com/scan/meta-cto-two.vercel.app) and confirm `scanned_at` is newer than the pre-build snapshot (~2026-10-26T02:53Z). Evidence log: [20261026-fi-agentic-verification.md](../research/20261026-fi-agentic-verification.md).

### Automated

- Integration tests: `GET /.well-known/mcp/server-card.json` 200; MCP initialize + `tools/list` smoke against local `next dev`.
- Eve evals remain separate; MCP tests assert **HTTP transport** and **DB read outcomes**.

### Manual

- Claude Desktop / ChatGPT: add remote MCP URL, list tools, call `search_requests` with `query: "CSV"`.
- `curl -H 'Accept: text/markdown' https://<host>/`

### Curl probes (T-A-12)

Replace `<host>` with `meta-cto-two.vercel.app` or `AGENTIC_CHECK_URL`:

```sh
curl -sS "https://<host>/llms.txt" | head
curl -sS "https://<host>/sitemap.xml" | head
curl -sS -i -H 'Accept: text/markdown' "https://<host>/" | head -20
curl -sS -i -H 'Accept: text/html' "https://<host>/" | head -20
curl -sS -i -H 'Accept: text/markdown' "https://<host>/no-such-agent-path" | head -20
curl -sS "https://<host>/.well-known/mcp/server-card.json" | head
curl -sS -X POST "https://<host>/api/mcp" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
```

Streamable HTTP requires `Accept: application/json, text/event-stream` on MCP POST; `Accept: application/json` alone returns **406**.

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
| AD-7 | Assessment demo documents open mutation MCP risk; production adopters gate writes behind auth. |

---

## Approval

**Current** — [ADR 0005](../adr/0005-fi-agentic-discoverability-and-mcp.md) accepted. **Tasks:** [feature-intelligence-agentic-discoverability.md](../tasks/feature-intelligence-agentic-discoverability.md).

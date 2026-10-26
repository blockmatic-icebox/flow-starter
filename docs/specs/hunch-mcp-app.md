# Spec — Hunch MCP App

**Status:** Draft  
**Last reviewed:** 2026-10-26  
**Initiative:** [hunch-mcp-app.md](../initiatives/hunch-mcp-app.md)  
**Related:** [feature-intelligence-agentic-discoverability.md](./feature-intelligence-agentic-discoverability.md), [ADR 0005](../adr/0005-fi-agentic-discoverability-and-mcp.md)

## Problem

Hunch exposes Streamable HTTP MCP with eight tools, but hosts that support [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) cannot discover or render an **interactive** UI bound to tool results. A normal Next.js page or external link is **not** an MCP App resource.

## Outcome

1. Register at least one UI resource discoverable via MCP `resources/list` and readable via `resources/read`.
2. Associate tools with that resource through `_meta.ui.resourceUri` where presentation adds value.
3. Serve HTML with MIME type **`text/html;profile=mcp-app`** and communicate through the official Apps bridge.
4. Preserve full tool usability for hosts without Apps support.

## Non-goals

- Replacing Eve or duplicating domain logic in the iframe.
- Direct database or server env access from the iframe bundle.
- OAuth or production mutation hardening (assessment demo scope unchanged until ADR 0011 fork).

---

## UI resource

| Field | Value |
| --- | --- |
| **URI** | `ui://hunch/explorer` |
| **Name** | Hunch Explorer |
| **MIME** | `text/html;profile=mcp-app` |
| **Purpose** | Compact workspace: Signals search/detail, Patterns metrics, Review queue preview |

Registration uses the official MCP Apps helper (exact API per installed `@modelcontextprotocol/ext-apps` version at Build time).

**Security:** Iframe runs host-sandboxed; data enters only via bridge + tool structured content — no `DATABASE_URL`, no server actions from the bundle.

---

## Tool associations (`_meta.ui.resourceUri`)

Hosts may open `ui://hunch/explorer` when presenting results from associated tools. Tools without association remain text/JSON-only.

| Tool | `_meta.ui.resourceUri` | Presentation in Explorer |
| --- | --- | --- |
| `search_requests` | `ui://hunch/explorer` | **Signals** — titles, themes, support counts, status |
| `get_request` | `ui://hunch/explorer` | **Signal detail** — problem, evidence, duplicates |
| `list_triage_queue` | `ui://hunch/explorer` | **Review** — pending decisions, rationale preview |
| `get_insights` | `ui://hunch/explorer` | **Patterns** — metrics, theme distribution, range |
| `submit_request` | `ui://hunch/explorer` (optional) | Draft / pending_confirm preview if structured payload is stable |
| `confirm_request` | — | Tool channel only unless host approval UI is trivial |
| `support_request` | — | Tool channel only |
| `set_disposition` | — | Tool channel only; PM commitment stays explicit |

Structured content shapes should reuse existing MCP tool return types; do not invent parallel DTOs in the iframe.

---

## Hunch Explorer UX (iframe)

Align with [DESIGN.md](../../DESIGN.md) MCP App section:

- **Fact vs suggestion vs uncommitted:** label recorded fields, harness suggestions, and draft actions distinctly.
- **States:** loading, empty, failure, degraded triage (`triage_steps.degraded`).
- **Tokens:** Paper `#F5F3ED`, Ink `#22241F`, Cobalt `#3454ED`, white surfaces — shared CSS variables or a minimal subset compatible with iframe bundle size.
- **Navigation:** deep links to human Review/Signals routes on the deployment host where the host allows outbound navigation; never required for tool-only clients.

---

## Non-UI fallback (mandatory)

For every tool:

- **Description** remains agent-oriented (when to call, pagination, disposition rules).
- **Text content** summarizes results for models and CLI clients.
- **Structured content** (where implemented) carries machine-readable payloads Explorer can render when loaded.

Failure to load `ui://hunch/explorer` must **not** block search, read, queue, insights, or mutations.

---

## Transport (unchanged)

| Surface             | Path                                             |
| ------------------- | ------------------------------------------------ |
| MCP Streamable HTTP | `POST /api/mcp` (canonical), `POST /mcp` (alias) |
| Discovery           | `/.well-known/mcp/server-card.json`, `llms.txt`  |

Standard methods: `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read` as applicable.

---

## Verification

Use [20261026-hunch-mcp-app-verification.md](../research/20261026-hunch-mcp-app-verification.md). **`tools/list` success alone is insufficient** — require `resources/read` body, MIME type, and at least one associated tool render path in a compatible host or harness.

---

## Eve parity

MCP tools and Eve tools must keep equivalent `@repo/fi` outcomes. Smoke evals use **owned** draft rows (`createDraftAndTriage` → `confirmRequest` → disposition) — see [feature-intelligence-eve-agent.md](./feature-intelligence-eve-agent.md) AG-7 and workflow evals under `evals/smoke/`.

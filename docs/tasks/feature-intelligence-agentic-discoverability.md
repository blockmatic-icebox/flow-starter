# Tasks: Feature Intelligence — agentic discoverability

**Last reviewed:** 2026-10-26  
**Status:** Build complete (2026-10-26)  
**Spec:** [feature-intelligence-agentic-discoverability.md](../specs/feature-intelligence-agentic-discoverability.md) (AD-1–AD-7)  
**ADR:** [0005](../adr/0005-fi-agentic-discoverability-and-mcp.md) (Accepted)  
**Initiative:** [feature-intelligence.md](../initiatives/feature-intelligence.md)

**Role:** Execution checklist — requirements live in the spec only.  
**Rules:** Respect **Depends on**. Commit subjects: `feat(web): T-A-4 well-known mcp`.  
**Env (Build):** `AGENTIC_CHECK_URL` (default `meta-cto-two.vercel.app`); `FI_MCP_DEMO_OPEN=1` on assessment deploy (mutations without bearer).

---

## Gates

| Gate | Requires | Unblocks |
| --- | --- | --- |
| **G-A0** | Human accepts **ADR 0005** | Any implementation |
| **G-A1** | **T-A-1**, **T-A-4** | MCP server card matches live endpoint (**T-A-20**) |
| **G-A2** | **T-A-10**, **T-A-11** | Is Agentic essential tier (markdown + 404) |
| **G-A3** | **T-A-20**, **T-A-21**, **T-A-23** | External MCP clients + **T-A-32** |
| **G-A4** | **T-A-30**, **T-A-33** | Ship / score claim |

**Critical path:** G-A0 → T-A-4 → T-A-20 → T-A-21 → T-A-23 → T-A-30 → T-A-33

**Parallel after G-A0:**

- **T-A-1** ∥ **T-A-2** ∥ **T-A-3** (discovery content; no shared hot files)
- **T-A-10** ∥ **T-A-11** after **T-A-1** (llms link in 404 body)
- **T-A-4** should list tools only after **T-A-21** tool names are stable — card may ship with static tool list first, refresh in **T-A-24**

---

## Dependency matrix

| Task | Depends on | AD | Primary write set |
| --- | --- | --- | --- |
| T-A-0 | G-A0 | — | ADR 0005 status → Accepted (human) |
| T-A-1 | T-A-0 | AD-4 | `apps/web/app/llms.txt/route.ts` or `public/llms.txt` |
| T-A-2 | T-A-0 | — | `apps/web/app/sitemap.ts` |
| T-A-3 | T-A-0 | — | `apps/web/app/(fi)/page.tsx`, layout metadata |
| T-A-4 | T-A-0, T-A-1 | AD-1 | `apps/web/app/.well-known/**/route.ts` |
| T-A-10 | T-A-1 | AD-5 | `apps/web/middleware.ts` or route `page.tsx` + markdown helper |
| T-A-11 | T-A-1 | AD-5 | `apps/web/app/not-found.tsx` |
| T-A-12 | T-A-10, T-A-11 | — | spec verification section only |
| T-A-20 | T-A-4, G-A1 | AD-2 | `apps/web/app/api/mcp/route.ts`, `@modelcontextprotocol/sdk` dep |
| T-A-21 | T-A-20 | AD-3 | `apps/web/lib/mcp/tools/*.ts` → `@repo/fi` |
| T-A-22 | T-A-21 | AD-7 | auth helper, env `FI_MCP_BEARER_TOKEN` |
| T-A-23 | T-A-21 | AD-2, AD-3 | `apps/web/tests/mcp/*.test.ts` or `packages/fi` integration via HTTP |
| T-A-24 | T-A-21 | AD-1 | refresh server-card tool list + `mcp.json` |
| T-A-30 | G-A3 | AD-6 | root `package.json`, `is-agentic` devDep |
| T-A-31 | T-A-20 | — | `docs/research/20261025-fi-browser-verification.md` |
| T-A-32 | G-A3 | — | manual evidence in research doc |
| T-A-33 | T-A-30, T-A-32 | — | `PRODUCT.md`, `ARCHITECTURE.md`, initiative |

---

## Wave 0 — Decision

- [x] **T-A-0** — Human accepts [ADR 0005](../adr/0005-fi-agentic-discoverability-and-mcp.md); set **Status: Accepted**; spec **Status: Current**

---

## Wave 1 — Discovery documents (parallel)

- [x] **T-A-1** — `llms.txt` (**AD-4**)
  - **Depends on:** T-A-0
  - **Do:** Product summary, routes, **When to use Feature Intelligence**, links to `/.well-known/mcp/server-card.json` and `/api/mcp`.
  - **Verify:** `curl -sS https://<host>/llms.txt` contains “when” + MCP URL.

- [x] **T-A-2** — Sitemap
  - **Depends on:** T-A-0
  - **Do:** Next `sitemap.ts` for `/`, `/requests`, `/triage`, `/insights`, `/requests/new`, `/chat`.
  - **Verify:** `curl -sS https://<host>/sitemap.xml` valid XML.

- [x] **T-A-3** — Homepage agent HTML + JSON-LD
  - **Depends on:** T-A-0
  - **Do:** SSR/plain HTML ≥500 chars meaningful text, H1, `SoftwareApplication` JSON-LD.
  - **Verify:** `is-agentic` `content-no-js` improves; view-source on `/`.

- [x] **T-A-4** — Well-known MCP metadata (**AD-1**)
  - **Depends on:** T-A-0, T-A-1
  - **Do:** `/.well-known/mcp/server-card.json`, `/.well-known/mcp.json`, optional `/.well-known/ai-catalog.json`; `endpoint` uses `APP_ORIGIN` or request host.
  - **Verify:** JSON validates; endpoint URL matches deployed `/api/mcp` after T-A-20.

---

## Wave 2 — Markdown negotiation & errors

- [x] **T-A-10** — Homepage Markdown negotiation (**AD-5**)
  - **Depends on:** T-A-1
  - **Do:** For `/`, if `Accept: text/markdown` → `Content-Type: text/markdown`, body ≥500 chars; HTML for `text/html`; header `Vary: Accept`.
  - **Verify:** `curl -sS -i -H 'Accept: text/markdown' https://<host>/` and HTML variant per spec.

- [x] **T-A-11** — Agent-friendly 404
  - **Depends on:** T-A-1
  - **Do:** 404 status; Markdown body when `Accept: text/markdown` with link to `/llms.txt`.
  - **Verify:** `curl` probe path per Is Agentic `agent-friendly-404`.

- [x] **T-A-12** — Document curl verification
  - **Depends on:** T-A-10, T-A-11
  - **Do:** Add commands to spec or research log; no code required.
  - **Verify:** Peer can run commands from doc.

**Gate G-A2** after T-A-10 + T-A-11.

---

## Wave 3 — MCP server (Streamable HTTP)

- [x] **T-A-20** — MCP route skeleton (**AD-2**)
  - **Depends on:** T-A-4, **G-A1**
  - **Do:** `POST /api/mcp` Streamable HTTP (`@modelcontextprotocol/sdk` transport); health for OPTIONS if needed; rate limit stub.
  - **Verify:** MCP Inspector or `tools/list` returns without error locally.

- [x] **T-A-21** — Phase A tools (**AD-3**)
  - **Depends on:** T-A-20
  - **Do:** Register `search_requests`, `get_request`, `list_triage_queue`, `get_insights` calling `@repo/fi` (reuse Zod from `agent/tools/*` where possible).
  - **Verify:** CSV search returns FR-001/002 rows like Eve smoke.

- [x] **T-A-22** — Phase B bearer (**AD-7**) — **N/A (demo-open)**
  - Assessment policy registers all mutation tools without bearer; documented in ADR 0005 and SECURITY.md.

- [x] **T-A-23** — Automated MCP smoke
  - **Depends on:** T-A-21
  - **Do:** Test initialize + list tools + one `search_requests` call (local `next dev` or route handler unit test).
  - **Verify:** `pnpm --filter web test` (or dedicated script) exit 0.

- [x] **T-A-24** — Sync server card with live tools
  - **Depends on:** T-A-21
  - **Do:** Regenerate or statically align tool names/descriptions in well-known JSON.
  - **Verify:** Card tools match `tools/list` output.

**Gate G-A3** after T-A-20, T-A-21, T-A-23.

---

## Wave 4 — Verification, CI, contracts

- [x] **T-A-30** — `is-agentic` CLI gate (**AD-6**)
  - **Depends on:** **G-A3**
  - **Do:** `devDependency` `is-agentic`; script `agentic:check`; document `AGENTIC_CHECK_URL`.
  - **Verify:** `pnpm agentic:check` — target `mcp-server` **pass**, `markdown-negotiation-vary` **pass**.

- [x] **T-A-31** — Vercel Deployment Protection note
  - **Depends on:** T-A-20
  - **Do:** Research log: public alias vs protection for external auditors.
  - **Verify:** Doc updated with date.

- [x] **T-A-32** — Manual external clients
  - **Depends on:** **G-A3**
  - **Do:** Claude Desktop / ChatGPT: remote MCP `https://<host>/api/mcp`; call `search_requests`.
  - **Verify:** Screenshot or log in research doc.

- [x] **T-A-33** — Contract sync
  - **Depends on:** T-A-30, T-A-32
  - **Do:** `PRODUCT.md` MCP row **Live**; initiative progress; check all **AD-1–AD-7**.
  - **Verify:** `pnpm --dir .agents flow:check` OK.

**Gate G-A4** = shippable agentic slice.

---

## Worker delegation map

| Worker | Tasks | Must not touch |
| --- | --- | --- |
| Discovery | T-A-1–3, T-A-10–11, T-A-24 | `api/mcp` until T-A-20 merged |
| MCP | T-A-20–23, T-A-22 | well-known without coordinating T-A-24 |
| QA/Docs | T-A-12, T-A-30–33 | — |

Integrator: merge **Wave 1 → 2 → 3 → 4**; run **T-A-30** on preview/prod URL.

---

## Acceptance

All **[AD-1–AD-7](../specs/feature-intelligence-agentic-discoverability.md#acceptance-criteria)** and Is Agentic **`mcp-server` pass** on production alias.

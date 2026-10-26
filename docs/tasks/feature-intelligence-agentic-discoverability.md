# Tasks: Feature Intelligence — agentic discoverability

**Last reviewed:** 2026-10-26  
**Status:** Plan draft (Build not authorized)  
**Spec:** [feature-intelligence-agentic-discoverability.md](../specs/feature-intelligence-agentic-discoverability.md)  
**ADR:** [0005](../adr/0005-fi-agentic-discoverability-and-mcp.md) (Proposed)

## Gates

| Gate | Requires | Unblocks |
| --- | --- | --- |
| **G-A1** | T-A-1–T-A-4 | MCP implementation (well-known + llms exist) |
| **G-A2** | T-A-10–T-A-12 | Is Agentic essential tier |
| **G-A3** | T-A-20 + T-A-21 | External client smoke (Claude/ChatGPT) |

**Critical path:** T-A-1 → T-A-10 → T-A-20 → T-A-30

---

## Wave 1 — Discovery documents (parallel)

- [ ] **T-A-1** — `public/llms.txt` or `app/llms.txt/route` with when-to-use + MCP links (**AD-4**)
- [ ] **T-A-2** — `sitemap.ts` / `sitemap.xml` for FI routes (**AD-5** support)
- [ ] **T-A-3** — Homepage JSON-LD + SSR text density (**content-no-js**)
- [ ] **T-A-4** — `/.well-known/mcp/server-card.json` + `/.well-known/mcp.json` (+ optional `ai-catalog.json`) (**AD-1**)

**Depends on:** ADR 0005 accepted.

---

## Wave 2 — Markdown & errors

- [ ] **T-A-10** — Middleware or route handlers: `Accept: text/markdown` on `/` (+ `Vary: Accept`) (**AD-5**)
- [ ] **T-A-11** — Custom not-found Markdown for `Accept: text/markdown` (**agent-friendly-404**)
- [ ] **T-A-12** — Link checker: `curl` snippets in spec verification section

**Depends on:** G-A1 (optional parallel with Wave 1 tail).

---

## Wave 3 — MCP server

- [ ] **T-A-20** — `POST /api/mcp` Streamable HTTP via `@modelcontextprotocol/sdk` (or Eve export if available)
- [ ] **T-A-21** — Wire Phase A tools to `@repo/fi`; Zod input schemas aligned with Eve tools
- [ ] **T-A-22** — Phase B bearer gate for mutation tools (**AD-7**)
- [ ] **T-A-23** — Integration test: initialize + `tools/list` + `search_requests` CSV smoke (**AD-2**, **AD-3**)

**Depends on:** G-A1, **G-A2** recommended before prod promote.

---

## Wave 4 — Verification & CI

- [ ] **T-A-30** — Add `is-agentic` devDependency + `pnpm agentic:check` (env `AGENTIC_CHECK_URL`)
- [ ] **T-A-31** — Document Deployment Protection vs public MCP audit in research log
- [ ] **T-A-32** — Manual: Claude Desktop + ChatGPT remote MCP URL (**G-A3**)
- [ ] **T-A-33** — Update PRODUCT, ARCHITECTURE, eve spec MCP row; ADR 0005 → Accepted

---

## Delegation map

| Worker | Tasks | Writes |
| --- | --- | --- |
| Web discovery | T-A-1–4, T-A-10–11 | `apps/web/app`, `public/` |
| MCP | T-A-20–23 | `apps/web/app/api/mcp`, shared fi wrappers |
| Docs/CI | T-A-30–33 | `package.json`, contracts |

---

## Acceptance

All **AD-1–AD-7** in the spec; Is Agentic `mcp-server` **pass** on production alias.

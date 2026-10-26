# Tasks — Hunch MCP App

Initiative: [hunch-mcp-app.md](../initiatives/hunch-mcp-app.md) · Spec: [hunch-mcp-app.md](../specs/hunch-mcp-app.md)

**Goal:** Standards-compliant MCP App vertical slice on top of live Streamable HTTP MCP, with workflow-safe Eve smoke evals.

**Branch:** `meta-cto` (assessment)

---

## Wave A — Contracts and language

- [x] **A-1** Initiative `docs/initiatives/hunch-mcp-app.md`
- [x] **A-2** Spec (resource URI, tool `_meta`, fallback)
- [x] **A-3** GLOSSARY MCP App terms
- [x] **A-4** DESIGN iframe states + tokens
- [x] **A-5** ARCHITECTURE boundary + build pipeline notes
- [x] **A-6** Verification research template (`docs/research/20261026-hunch-mcp-app-verification.md`)

**Gate A:** `pnpm --dir .agents flow:check` (docs conventions)

---

## Wave B — Resource registration

- [ ] **B-1** Add MCP Apps extension dependency (version pinned after doc check)
- [ ] **B-2** Register `ui://hunch/explorer` with `text/html;profile=mcp-app`
- [ ] **B-3** Wire `resources/list` and `resources/read` in `/api/mcp` handler
- [ ] **B-4** Unit or integration test: read returns HTML + correct MIME

**Gate B:** Protocol calls pass in local harness

---

## Wave C — Explorer bundle

- [ ] **C-1** Dedicated iframe entry (React) — Signals / Patterns / Review panels
- [ ] **C-2** Official Apps bridge init + host message handling
- [ ] **C-3** Paper + Cobalt tokens; loading / empty / error / degraded states
- [ ] **C-4** No direct DB or server env in bundle

**Gate C:** Manual host or lab renders Explorer from `resources/read`

---

## Wave D — Tool integration

- [ ] **D-1** `_meta.ui.resourceUri` on `search_requests`, `get_request`, `list_triage_queue`, `get_insights`
- [ ] **D-2** Structured content shapes stable for Explorer consumption
- [ ] **D-3** Text fallback verified for each associated tool
- [ ] **D-4** Optional `submit_request` preview (if low risk)

**Gate D:** Associated tool call + UI render in compatible host

---

## Wave E — Eve eval isolation

- [x] **E-1** Refactor `set-disposition-monitor.eval.ts` — owned draft → confirm → monitor
- [x] **E-2** Add `confirm-after-approval.eval.ts` (publish after explicit confirm)
- [x] **E-3** Add `merge-disposition.eval.ts` — owned published pair + merge

**Gate E:** `pnpm exec eve eval smoke` exit 0 — verified 2026-10-26 (9 passed, 1 skipped)

---

## Wave F — Verification and demo

- [ ] **F-1** Fill [20261026-hunch-mcp-app-verification.md](../research/20261026-hunch-mcp-app-verification.md) with protocol evidence
- [ ] **F-2** Update agentic verification / Is Agentic notes if score claims change
- [ ] **F-3** Optional external MCP App host (OpenAI quickstart or ext-apps lab)

**Gate F:** Resource readable on production alias; Explorer demo recorded

---

## Reference

- MCP Apps overview: https://modelcontextprotocol.io/extensions/apps/overview
- ext-apps: https://github.com/modelcontextprotocol/ext-apps
- Existing MCP spec: [feature-intelligence-agentic-discoverability.md](../specs/feature-intelligence-agentic-discoverability.md)

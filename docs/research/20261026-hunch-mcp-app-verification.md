# Hunch MCP App — verification log (template)

**Research date:** 2026-10-26  
**Last reviewed:** 2026-10-26  
**Status:** Exploratory  
**Branch:** `meta-cto`  
**Host under test:** `https://meta-cto-two.vercel.app` (or local `pnpm --filter web dev`)

## Scope

Confirm the MCP App is **discoverable**, **readable**, and **meaningful** — not merely that MCP tools respond.

---

## Protocol checks

| Check | Command / method | Expected | Result | Notes |
| --- | --- | --- | --- | --- |
| Initialize | MCP `initialize` on `POST /api/mcp` | Success | pass (prod curl 2026-10-26) | Alias `meta-cto-two` → `a9ccd5f1e` |
| Tools list | `tools/list` | Eight FI tools present | pass (local `route.test.ts`) |  |
| Resources list | `resources/list` | Includes `ui://hunch/explorer` | pass (local) |  |
| Resource read | `resources/read` for `ui://hunch/explorer` | HTML body | pass (local) |  |
| MIME type | Response metadata | `text/html;profile=mcp-app` | pass (local) |  |
| Tool meta | `tools/list` entry for `search_requests` | `_meta.ui.resourceUri` = `ui://hunch/explorer` | pass (local) |  |
| Non-UI fallback | `tools/call` `search_requests` without UI host | Usable text + structured content | pass (local w/ `DATABASE_URL`) |  |

**Insufficient evidence:** `tools/list` only, curl without `resources/read`, or screenshot of a normal web page.

---

## Tool association matrix (spot check)

| Tool | Structured result renders in Explorer | Text-only host OK |
| --- | --- | --- |
| `search_requests` |  |  |
| `get_request` |  |  |
| `list_triage_queue` |  |  |
| `get_insights` |  |  |
| `submit_request` | N/A or preview |  |
| `confirm_request` | N/A (tool channel) |  |
| `support_request` | N/A |  |
| `set_disposition` | N/A |  |

---

## UI states (iframe)

| State              | Trigger                             | Pass? | Notes |
| ------------------ | ----------------------------------- | ----- | ----- |
| Loading            | Slow tool / bridge init             |       |       |
| Empty              | Zero search hits / empty queue      |       |       |
| Failure            | Tool error surfaced to UI           |       |       |
| Degraded           | Harness `degraded: true` in payload |       |       |
| Fact vs suggestion | Labels visible                      |       |       |

---

## Eve workflow smoke (owned rows)

| Eval | Command | Expected | Result |
| --- | --- | --- | --- |
| AG-7 no auto-confirm | `pnpm exec eve eval smoke` → `submit-no-auto-confirm` | `pending_confirm` after submit | pass (2026-10-26) |
| Confirm after approval | `confirm-after-approval` | `published` after confirm | pass (2026-10-26) |
| Monitor disposition | `set-disposition-monitor` | Owned row `monitor` + rationale | pass (2026-10-26) |
| Merge disposition | `merge-disposition` | Owned pair merge + `mergeTargetId` | pass (2026-10-26) |

---

## Automated (record exit codes)

| Command | Result |
| --- | --- |
| `pnpm --filter web test` (MCP routes) | exit 0 — 30 pass, 3 skipped (2026-10-26 local) |
| `pnpm agentic:check` | not run (production lacks MCP App until promote) |
| `pnpm exec eve eval smoke` | exit 0 — 9 passed, 1 skipped (2026-10-26 local) |

---

## External host (optional)

| Host | Version / date | Explorer loaded | Tool → UI path | Notes |
| ---- | -------------- | --------------- | -------------- | ----- |
|      |                |                 |                |       |

---

## Findings classification

| ID  | Finding | Class (defect / missing / risk / trade-off / N/A) |
| --- | ------- | ------------------------------------------------- |
|     |         |                                                   |

---

## Sign-off

- [ ] Resource URI and MIME verified on target host
- [ ] At least one associated tool renders in Explorer or official lab
- [ ] Non-UI clients remain usable
- [x] Eve smoke uses isolated rows only

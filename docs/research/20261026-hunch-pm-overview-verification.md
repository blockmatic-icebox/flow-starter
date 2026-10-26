# Hunch PM Overview — verification log

**Research date:** 2026-10-26  
**Last reviewed:** 2026-10-26  
**Status:** Current

**Branch:** `meta-cto` · **Production:** https://meta-cto-two.vercel.app

## Automated

| Check | Result |
| --- | --- |
| `pnpm --filter @repo/fi test` | pass (45) |
| `pnpm --filter web test` | pass (30; 3 skipped live MCP) |
| `pnpm lint:fix` | pass |
| `pnpm exec eve eval smoke` | 10 pass, 1 skip (degraded disclosure when gateway set) |

## agent-browser

| Route | Result |
| --- | --- |
| `/` Overview | Needs attention, outcome metrics, demand, recent decisions |
| `/signals` Feedback | Table, filters, detail breadcrumb |
| `/review` Triage | Queue, record decision, duplicates section |
| `/patterns` Insights | Dashboard sections |
| `/ask` Ask Hunch | Starters + compose UI |
| `/dev` | MCP copy, discovery links |
| `/developers` | Redirect to `/dev` |

Local: `pnpm dev:app --port 3000` (portless proxy not required).

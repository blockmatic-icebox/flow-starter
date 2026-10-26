# Hunch — full-site browser QA

**Research date:** 2026-10-26  
**Last reviewed:** 2026-10-26  
**Status:** Current  
**Branch:** `meta-cto`  
**Session:** `hunch-full-qa-bb991ad321bf` (agent-browser)  
**Local base URL:** `http://localhost:3000`  
**Production:** https://meta-cto-two.vercel.app

## Automated baseline

| Command | Exit | Notes |
| --- | --- | --- |
| `pnpm qa` | 1 | Knip reports pre-existing unused `apps/web/scripts/vercel-build.mjs`, unused `@modelcontextprotocol/sdk` dep, unused exports in `hunch-content.ts` / `fi-home-content.ts` |
| `pnpm --filter @repo/fi test` | 0 | 46 pass |
| `pnpm --filter web test` | 0 | 30 pass, 3 skipped live MCP |
| `CI=true pnpm test:browser` | 0 | After `<main>` landmark fix |
| `pnpm exec eve eval smoke` | 0 | 10 pass, 1 skip (degraded disclosure when gateway set) |
| `pnpm build:web` | 0 | |
| `pnpm --filter @repo/genui test` | 0 | 129 pass (post abort-handling fix) |

## Local agent-browser matrix

| ID | Result | Evidence |
| --- | --- | --- |
| `/` Overview | Pass | Needs attention, outcome metrics, demand, recent decisions; Triage badge **52** |
| `/signals` | Pass | Table + nav (spot-check via redirects from `/requests`) |
| `/review` | Pass | **52** awaiting review, sort control, record decision panel |
| `/patterns` | Pass | Insights dashboard (via `/insights` redirect) |
| `/ask` | Pass | Starters; duplicate query renders Answer + comparison copy after compose |
| `/dev` | Pass | MCP discovery copy (via `/developers` redirect) |
| `/feedback/new` | Not re-run | Prior hardening pass; no regression signal in automated tests |
| W-5 queue ~50 | Partial | **52** open after seed + eve eval side effects (acceptable for demo) |
| W-8 Ask (was `/chat`) | Pass | `/ask` + `/chat` → `/ask` |
| Legacy redirects | Pass | `/chat`, `/triage`, `/requests`, `/insights`, `/developers` |
| Mobile 375px | Partial | `agent-browser viewport` unavailable in CLI build; desktop shell verified |
| Console | Partial | React dev warning on controlled `value` without `onChange` in GenUI subtree (dev only) |

### Ask Hunch detail

- `POST /api/genui/compose` returns `start` → `partial` → `complete` for duplicate intent (curl verified).
- UI showed `Stream error: truncated_stream` when fetch aborted (stale ref click / HMR); fixed by treating `AbortError` as `aborted` in `consumeNdjsonResponse` and ignoring in client.
- Reporting prioritization starter returns empty catalog message (routing + seed themes) — valid `StatusMessage`, not a 5xx.

## Fixes in this pass

| Change | Why |
| --- | --- |
| `WorkspaceSheet` → `<main>` | Playwright smoke `getByRole('main')`; a11y landmark |
| NDJSON `aborted` reason + Ask client ignore | Avoid false “truncated_stream” on superseded compose |

## Production re-verify

_See section below after deploy._

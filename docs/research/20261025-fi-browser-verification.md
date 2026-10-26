# Feature Intelligence — browser verification (T-3-9)

**Research date:** 2026-10-25

**Last reviewed:** 2026-10-26

**Status:** Current

**Environment:** `http://localhost:3000` (`pnpm exec next dev -p 3000`), seeded DB (`pnpm seed:fi`, 500 rows)

**Tool:** agent-browser sessions `fi-spec-verify-*`

## Summary (demo depth — 2026-10-26)

| ID | Result | Notes |
| --- | --- | --- |
| W-1 | Pass | `/requests` lists seeded titles; theme filter chips (All themes + registry keys) |
| W-2e | Pass | (Prior pass 2026-10-25) External thank-you + similar-ideas when matches |
| W-2i | Pass | (Prior pass) Internal dupes-first, confirm → detail |
| W-3 | Partial | Lexical near-dup on live external submit (spec-intended); seed/matrix + smoke cover FR-001/002 |
| W-4 | Pass | (Prior pass) Support on detail |
| W-5 | Pass | Nav **Triage 50**; queue shows **50** “Review & disposition” rows; subtitle “sorted by support” (server) |
| W-5a | Pass | Badge **50** matches open queue after seed |
| W-6 | Pass | (Prior pass) Transparency steps on detail |
| W-7 | Pass | **Open queue 50**; range **90d**; north-star cards + weekly panels + themes + judgment links |
| W-8 | Pass | `/chat` prompt starters + composer |
| W-9 | Pass | (Prior pass) Submit loading `aria-live` + stage labels |
| AC-4 | Pass | Theme chips on `/requests` |

**Not re-run this session:** W-2e/i, W-4, W-6, W-9 (unchanged since 2026-10-25 pass).

## Summary (MVP baseline — 2026-10-25)

Historical record at 8 open queue before 500-row seed; superseded by table above for demo depth.

## Demo rehearsal script (T-4-5)

1. Open **Insights** — call out open queue count and capture rate.
2. **Triage** — disposition two items (e.g. Monitor → Merge) with rationale; save.
3. Refresh **Insights** — note capture rate / queue delta.
4. Optional: **Submit** external live request; confirm thank-you.
5. Optional: **Ask** — product question only (no DB writes).

Record with any external screen recorder; no in-app capture.

## Commands (2026-10-26 verification)

```bash
pnpm seed:fi                         # ~30s local; 500 rows
pnpm qa                              # exit 0
pnpm build:web                       # exit 0
pnpm exec eve eval smoke             # 4/4
pnpm --filter @repo/fi test          # 18/18
```

## Spec acceptance (AC-1–AC-8)

| ID | Result | Evidence |
| --- | --- | --- |
| AC-1 | Met | Submit + harness; `triage_completed_at` (unit/harness tests + prior W-2) |
| AC-2 | Partial | W-3 lexical live submit; SD-4 / search-csv smoke |
| AC-3 | Met | Inline triage disposition (prior W-5 expand + rationale) |
| AC-4 | Met | W-1 + theme filter |
| AC-5 | Met | W-6 transparency |
| AC-6 | Met | W-7 six north-star cards + trends at 90d; open queue **50** |
| AC-7 | Met | `pnpm qa` exit 0 (2026-10-26) |
| AC-8 | Met | Intake link on confirm + `recordPmReviewStarted` (code + prior W-5) |

MVP + demo depth tasks: [feature-intelligence.md](../tasks/feature-intelligence.md), [feature-intelligence-demo-depth.md](../tasks/feature-intelligence-demo-depth.md) (complete).

## Traceability snapshot (automated — 2026-10-26)

| Family | Met | Partial | Notes |
| --- | --- | --- | --- |
| SD-1–SD-8 | All | — | `manifest.test.ts`, `fixture.test.ts`, `generate-seed.test.ts`, eve smoke |
| SD-9 | — | Doc | Local `pnpm seed:fi` ~30s; no CI timing assertion in repo |
| AN-1–AN-8 | All | — | `insights-dashboard.tsx`, `get-insights.ts`, `bucketing.test.ts`, `insights-range.test.ts`, `compute-insights.test.ts` |
| AG-1,3,5–7 | Met | — | 8 tools in `agent/tools/`; smoke ×4; `/chat` ask-only |
| AG-2,4 | Partial | — | Tools shipped; no dedicated smoke eval (manual / harness tests) |
| VT-1–VT-3, VT-5 | Met | — | Testing spec links; 4 smoke evals; fi unit tests |
| VT-4 | Met | — | W-* checklist (this doc + prior passes) |

## Production deployment (Vercel `meta-cto`)

- **URL:** https://meta-cto-gaboesquivel.vercel.app
- **Database:** Neon project `meta-cto-fi` — production `DATABASE_URL` synced to pooled endpoint (2026-10-26); `pnpm seed:fi` against that URL yields **500** rows / **50** open queue (Neon MCP `run_sql` verified).
- **Browser (2026-10-26):** Pre-fix production showed **8** open (static prerender at old build). **`export const dynamic = "force-dynamic"`** on `app/(fi)/layout.tsx` so triage badge and insights read live DB after redeploy.
- **Access:** Deployment Protection / SSO — use Vercel share link or `vercel curl` for smoke; do not commit share tokens.
- **Redeploy:** Push `meta-cto` for Git build; CLI `vercel deploy` must run from monorepo root (project `rootDirectory` = `apps/web`).

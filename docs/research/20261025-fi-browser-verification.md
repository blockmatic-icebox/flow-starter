# Feature Intelligence — browser verification (T-3-9)

**Research date:** 2026-10-25

**Last reviewed:** 2026-10-25

**Status:** Current

**Environment:** `http://localhost:3000` (Next dev), seeded DB (`pnpm seed:fi`)

**Tool:** agent-browser session `fi-verify`

## Summary

| ID | Result | Notes |
| --- | --- | --- |
| W-1 | Pass | `/requests` lists seeded titles with theme badges and sources |
| W-2e | Pass | External copy (“We heard this as”, Submit feedback, thank-you + view link); similar-ideas radio when matches |
| W-2i | Pass | Internal dupes-first, PM summary collapsible, confirm → detail |
| W-3 | Partial | Near-duplicate lexical matches surfaced on external confirm (FR-001 title overlap) |
| W-4 | Pass | Support control on `/requests/00000000-0000-4000-8000-000000000001` |
| W-5 | Pass | `/triage` shows 8 items with inline disposition combobox + rationale |
| W-5a | Pass | Nav badge **Triage 9** after one new pending item; empty queue not exercised |
| W-6 | Pass | “How this was evaluated” expands step list |
| W-7 | Pass | `/insights` — open queue **8**, decision capture **20%**, four metric cards |
| W-8 | Pass | `/chat` prompt starters + composer; no mutation tools wired |
| W-9 | Pass | `aria-live` + rotating stage labels on submit loading |
| AC-4 | Pass | `/requests?theme=` filter chips via `themeRegistry` |

## Demo rehearsal script (T-4-5)

1. Open **Insights** — call out open queue count and capture rate.
2. **Triage** — disposition two items (e.g. Monitor → Merge) with rationale; save.
3. Refresh **Insights** — note capture rate / queue delta.
4. Optional: **Submit** external live request; confirm thank-you.
5. Optional: **Ask** — product question only (no DB writes).

Record with any external screen recorder; no in-app capture.

## Commands

```bash
pnpm qa                              # exit 0
pnpm build:web                       # webpack build, exit 0
pnpm exec eve eval smoke             # 4/4 eve smoke evals
pnpm --filter web test:browser
```

## Spec acceptance (AC-1–AC-8)

| ID | Result | Evidence |
| --- | --- | --- |
| AC-1 | Met | Submit flow + `createDraftAndTriage` / confirm; `triage_completed_at` on harness path |
| AC-2 | Partial | W-3 lexical near-dup on live external submit; seed/matrix tests + smoke submit gates |
| AC-3 | Met | W-5 inline disposition with rationale |
| AC-4 | Met | W-1, theme filter chips (`/requests?theme=`) |
| AC-5 | Met | W-6 transparency steps on detail |
| AC-6 | Met | W-7 four metrics + sample counts from seed |
| AC-7 | Met | `pnpm qa` on assessment branch |
| AC-8 | Met | `confirmRequest` intake link + `recordPmReviewStarted` on triage expand (W-5) |

MVP waves 0–4: see [tasks checklist](../tasks/feature-intelligence.md) (all checked).

## Production deployment (2026-10-25)

- **URL:** https://meta-cto-gaboesquivel.vercel.app
- **Deployment:** `dpl_G3N4MQfBFixH4prZhdamdVUC8YPK` (Ready), commit `28f8ca91c`
- **Note:** Vercel Authentication enabled; unauthenticated HTTP may return 403. Sign in to Vercel or use a deployment share link for browser smoke.

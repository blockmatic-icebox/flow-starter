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
| W-2e | Pass | External submit → confirm; queue badge 8→9 |
| W-2i | Partial | Internal form loads; one run landed on published detail (link flow) — re-test confirm+dupes on next pass |
| W-3 | Partial | Near-duplicate lexical matches surfaced on external confirm (FR-001 title overlap) |
| W-4 | Pass | Support control on `/requests/00000000-0000-4000-8000-000000000001` |
| W-5 | Pass | `/triage` shows 8 items with inline disposition combobox + rationale |
| W-5a | Pass | Nav badge **Triage 9** after one new pending item; empty queue not exercised |
| W-6 | Pass | “How this was evaluated” expands step list |
| W-7 | Pass | `/insights` — open queue **8**, decision capture **20%**, four metric cards |
| W-8 | Pass | `/chat` prompt starters + composer; no mutation tools wired |
| W-9 | Not recorded | Loading stages not captured in this pass (harness fast without gateway) |

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

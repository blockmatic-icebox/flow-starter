# Spec: Feature Intelligence — seed data (eve v1 + demo)

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Consumers:** `@repo/fi` seed command, web UI, **eve v1** tool smoke tests  
**Related:** [feature-intelligence.md](./feature-intelligence.md) · [eve agent spec](./feature-intelligence-eve-agent.md)

## Goals

- **Deterministic** rows (stable UUIDs) so scripts, evals, and demo recordings reference the same ids.
- **Idempotent** re-run (`pnpm` seed clears FI tables and reloads fixture).
- Cover every **eve tool** in [AG-1–AG-6](./feature-intelligence-eve-agent.md#acceptance-criteria-agent-slice) without calling the live triage model.
- Enough volume for duplicate retrieval (≥10 published snippets).

## Delivery (Plan / Build)

| Artifact       | Location                                           |
| -------------- | -------------------------------------------------- |
| Fixture source | `packages/fi/seed/fixture.json` (or `.ts` export)  |
| Loader         | `packages/fi/seed/load.ts` → `@repo/db`            |
| CLI            | `pnpm --filter @repo/fi seed` (runs after migrate) |
| Dev docs       | Root README: “Seed before `eve dev`”               |

**Environment:** Requires reachable Postgres (`DATABASE_URL` or Neon Local default URL after `pnpm db:start`). See [initiative § Plan — Postgres / Neon](../initiatives/feature-intelligence.md#plan--postgres--neon-connectivity). Seed fails clearly if DB unreachable.

**Not seeded:** embeddings/pgvector (lexical dupes only). Post-seed, run one live `submit_request` for AI triage demo. Seed uses `theme_key` on all rows.

---

## Stable IDs

Use UUID v4-shaped fixed ids (`00000000-0000-4000-8000-00000000000n`) so logs and tool output are copy-pasteable.

| Id      | Short ref |
| ------- | --------- |
| `…0001` | `FR-001`  |
| `…0002` | `FR-002`  |
| …       | …         |
| `…000c` | `FR-012`  |

---

## Catalog (12 requests)

### Theme: `reporting_exports`

| Id | Title | Source | Status | Support | Disposition | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FR-001 | Export dashboards to CSV | customer | published | 14 | — | Canonical CSV need; high signal |
| FR-002 | Download CSV of report data | support | published | 6 | — | Near-duplicate of FR-001 |
| FR-003 | Scheduled weekly email reports | prospect | published | 3 | monitor | Example closed loop + rationale |
| FR-004 | PDF export for board decks | internal | published | 2 | — | Same theme, not duplicate of CSV |

### Theme: `collaboration_sharing`

| Id | Title | Source | Status | Support | Disposition | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FR-005 | Share dashboards with external clients | customer | published | 11 | — | Triage queue priority |
| FR-006 | Comments on chart widgets | internal | published | 8 | — |  |
| FR-007 | Real-time co-editing on filters | prospect | published | 9 | — | High support |
| FR-008 | @mentions in dashboard notes | support | published | 1 | decline | Shows declined + rationale |

### Theme: `integrations_alerts`

| Id | Title | Source | Status | Support | Disposition | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FR-009 | Slack alert when KPI drops | support | published | 5 | — |  |
| FR-010 | PagerDuty for critical metrics | customer | published | 4 | — |  |

### Non-published (workflow states)

| Id | Title | Source | Status | Notes |
| --- | --- | --- | --- | --- |
| FR-011 | Mobile push for alerts | internal | pending_confirm | Pre-filled triage fields; for `confirm_request` / web confirm **without** model |
| FR-012 | — | — | — | Reserved id for tests that create new rows |

**FR-011 fields (pre-baked triage):**

- `problem_statement`: “Teams need proactive mobile notifications when KPIs breach thresholds.”
- `theme_key`: `integrations_alerts`
- `decision_brief`: one paragraph for PM
- `triage_completed_at`: set
- `duplicate_candidates`: link to FR-009 with score 0.72

---

## Disposition examples (audit trail)

| Request | Disposition | Rationale (excerpt) |
| --- | --- | --- |
| FR-003 | monitor | “Valuable; wait for CSV export volume from FR-001/002.” |
| FR-008 | decline | “Overlaps comment vendor roadmap; use FR-006 thread instead.” |

---

## Duplicate graph (for search + submit tests)

```text
FR-001 ←→ FR-002   (strong lexical + semantic pair)
FR-009 ~  FR-011   (candidate at intake)
FR-006 ⊥  FR-008   (related theme, not merge)
```

**Eve manual script (post-seed):**

1. `search_requests { "query": "CSV export" }` → includes FR-001, FR-002
2. `get_request { "requestId": "…0001" }` → candidates include FR-002
3. `submit_request` with title “Need csv dump of analytics” → triage should surface FR-001/002 (live model)

---

## Eve v1 tool test matrix

| Tool | Seed-only pass | Live model pass |
| --- | --- | --- |
| `search_requests` | Query `collaboration` → FR-005–007 | — |
| `get_request` | FR-008 includes decline rationale | — |
| `list_triage_queue` | Returns **8** published without disposition (FR-001,002,004–007,009,010) | — |
| `support_request` | `supporterKey: "eve-test-1"`, FR-007 → support 9→10 | — |
| `set_disposition` | FR-010 → `monitor` + rationale | — |
| `get_insights` | `openQueueCount` = 8, `decisionCaptureRate` = 2/(2+8); rises when PM dispositions in demo | — |
| `confirm_request` | FR-011 → published | — |
| `submit_request` | — | New row + triage preview |

**Queue count note:** FR-003 and FR-008 are dispositioned; they must **not** appear in `list_triage_queue`.

---

## Supporter keys (seed)

| Key | Used for |
| --- | --- |
| `seed-supporter-a` | FR-001, FR-005 (pre-seeded support rows) |
| `seed-supporter-b` | FR-001 (second supporter) |
| `eve-test-1` | Reserved for automated / manual eve `support_request` test |

---

## Transparency payload

Each published seed row includes minimal `triage_steps`:

```json
{
  "version": 1,
  "steps": [
    {
      "name": "retrieve_candidates",
      "detail": "Seed fixture; 3 lexical matches"
    },
    { "name": "extract_problem", "detail": "Seed fixture" }
  ],
  "model": "seed",
  "duration_ms": 0
}
```

Live submits replace this with real pipeline metadata.

---

## Acceptance (seed)

| ID | Criterion |
| --- | --- |
| SD-1 | `pnpm --filter @repo/fi seed` is idempotent (second run same counts). |
| SD-2 | All FR-001–FR-011 ids exist with documented status/disposition. |
| SD-3 | `list_triage_queue` length matches matrix (**8**). |
| SD-4 | `search_requests` for `CSV` returns FR-001 and FR-002. |
| SD-5 | README documents seed before `eve dev` / web dev. |
| SD-6 | After seed, `getInsights().sample.publishedCount >= 10` and `dispositionWithRationaleCount >= 2`. |

---

## Approval

**Accepted.** Implement during **Build** wave 0 (schema + seed before agent tools and eve evals).

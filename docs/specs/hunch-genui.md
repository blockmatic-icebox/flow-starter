# Hunch — product UI and GenUI

**Status:** Current  
**Last reviewed:** 2026-10-26  
**Decision:** Accepted (assessment redesign, 2026-10-25)

## Product surfaces

| Route | Screen | Backend |
| --- | --- | --- |
| `/` | Overview | `listAttentionItems`, `getInsights`, `listRecentDecisions` |
| `/signals` | Feedback list | `searchRequests` |
| `/signals/[id]` | Feedback detail | `getRequest`, support action |
| `/feedback/new` | Add feedback | `createDraftAndTriage`, `confirmRequest` |
| `/review` | Triage queue | `listTriageQueue`, `setDisposition` |
| `/patterns` | Insights | `getInsights` |
| `/dev` | Developer overview | static discovery links |
| `/ask` | Ask Hunch | `POST /api/genui/compose` (read-only) |

Legacy paths (`/requests`, `/triage`, `/insights`, `/chat`) redirect to the routes above.

## Visual system

Paper + Cobalt (see [DESIGN.md](../../DESIGN.md)): framed shell (sidebar + top bar), inset white workspace, cobalt reserved for primary action and evidence links.

## GenUI architecture

Reuses `@repo/genui` pipeline ([genui.md](../../.agents/flow/specs/genui.md)) — no second renderer.

| Layer | Location |
| --- | --- |
| Compose orchestration (FI data) | `apps/web/app/_lib/genui/compose-fi.ts` |
| Grounded records | `apps/web/app/_lib/genui/fi-records.ts` |
| NDJSON API | `apps/web/app/api/genui/compose/route.ts` |
| Client | `apps/web/app/(fi)/ask/ask-hunch-client.tsx` → `GenuiRenderer` |

**Tier:** Tier-1 FI routing over `@repo/fi` reads; tier-3 optional prose via `synthesizeOpenEndedAnswer` when `AI_GATEWAY_API_KEY` is set (search-fallback path). No writes from compose or generated controls.

**Registered components (Hunch):** `EvidenceQuote`, `RankedSignalList` (plus shared `@repo/genui` catalog).

### Scenario routing (representative)

| User intent (examples) | Composition |
| --- | --- |
| Reporting prioritization | `SectionStack`: Answer + ranked `CollectionGrid` |
| Duplicate check | `SectionStack`: Answer + `ComparisonView` |
| Disagreement / public links | `SectionStack`: Answer + `DocumentationBlock` per quote |
| Monthly change | `DataExplorer` metrics + Answer with theme baseline |
| Last week’s decisions | `TimelineView` + Answer (no ship implied) |
| Integration summarize failure | `StatusMessage` + source `CollectionGrid` |
| No matches | `StatusMessage` empty/warning |

### Gaps vs historical `apps/flow` demo

- `apps/flow` removed ([ADR 0014](../../.agents/flow/decisions/adr/0014-web-only-product-application.md)); patterns live in `@repo/genui` + product adapters.
- Missing for assessment: daily compose caps, rate-limit hooks (optional per extraction inventory).
- `RankedSignalList` links to `/review` for draft decisions (plain anchors, not privileged actions).

## Non-goals

- GenUI-driven merge/publish without Review.
- Replacing eve/MCP tool contracts.

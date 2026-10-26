# Initiative — Hunch redesign (Meta CTO assessment)

**Status:** Phase 1 + Phase 2 shipped; **Phase 3 PM Overview & language** in progress on `meta-cto`

## Decided

- Rebrand human UI to **hunch** (lowercase wordmark, Paper + Cobalt).
- Preserve `@repo/fi` capabilities, server actions, MCP, and seed data.
- GenUI via `@repo/genui` + product `compose-fi` adapter (not a parallel UI tree).

## Assumed

- Assessment demo remains unauthenticated.
- `design-taste-frontend` skill is not in `skills-lock.json`; visual direction follows approved mockups and Framed Sheet constraints in DESIGN.md.

## Open

- Wire tier-3 gateway prose for unmatched Ask prompts when `AI_GATEWAY_API_KEY` is set.
- Register privileged GenUI actions for “draft decision” deep links into Review.

## Waves (phase 2)

| Wave | Focus                                              |
| ---- | -------------------------------------------------- |
| A    | Pulse data fix + compose-fi/API tests              |
| B    | Shared GenUI components (evidence, ranked signals) |
| C    | Tier-3 Ask via gateway                             |
| D    | Review + Add feedback mockup layouts               |
| E    | Route/link/glossary cleanup                        |
| F    | Optional GenUI navigate actions → Review           |
| G    | agent-browser verification + state matrix          |

## Phase 3 — PM Overview & language

- Overview dashboard (needs attention, metrics, demand, recent decisions)
- Product navigation labels (Overview, Feedback, Triage, Insights)
- `/dev` developer surface; trustworthy period vs snapshot metrics

## Tasks (execution)

- Phase 1: [hunch-redesign.md](../tasks/hunch-redesign.md)
- Phase 2: [hunch-hardening.md](../tasks/hunch-hardening.md)
- Phase 3: [hunch-pm-overview.md](../tasks/hunch-pm-overview.md)

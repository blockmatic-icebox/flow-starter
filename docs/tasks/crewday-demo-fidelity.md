# Tasks — Crewday demo fidelity

**Initiative:** [crewday-demo-fidelity.md](../initiatives/crewday-demo-fidelity.md)  
**Spec:** [crewday-demo-fidelity.md](../specs/crewday-demo-fidelity.md)

## Phase 1 — Contracts

- [x] Initiative, spec, tasks documents
- [x] `crewday-scenario.ts` canon
- [x] Update PRODUCT, DESIGN, ARCHITECTURE, README, GLOSSARY
- [x] Supersede 500-row claims; reconcile MCP App docs (implemented)

## Phase 2 — Fixtures

- [x] Scenario modules A–H + lifecycle + open queue (**80** rows assembled)
- [x] `assemble-seed.ts`; `generate-seed.ts` → `assembleCrewdaySeed` (bulk/anchor generators removed)
- [x] Export demo context map for web (`getCrewdayDemoContextByRequestId`)

## Phase 3 — Seed pipeline

- [x] `manifest.ts` counts (**80** total, **13** open queue, **20** duplicate edges, **4** intake links)
- [x] Semantic `validate-manifest.ts`
- [x] Transactional `load.ts`
- [x] Safe reseed / hosted refresh notes in spec

## Phase 4 — Themes & triage

- [x] Crewday `themeRegistry` (nine keys)
- [x] Agent instructions + triage/theme tests (`pnpm --filter @repo/fi test` — 50/50)

## Phase 5 — UI, GenUI, MCP

- [x] Crewday demo context (`hunch-content`, signal detail via demo context map)
- [x] Eight Ask Hunch starters + `compose-fi-routes` intents
- [x] MCP / Explorer Crewday copy (verify in `register-tools`, `mcp-app`)

## Phase 6 — Tests & eval isolation

- [x] Seed unit tests aligned with Crewday manifest
- [x] `EVE_EVAL_DATABASE_URL` required in `evals/evals.config.ts` (fail closed)
- [ ] Full smoke/MCP/GenUI matrix green under `pnpm --filter web test` (run locally; suite can be slow)

## Phase 7 — Verify

- [x] `pnpm --filter @repo/fi test` (50/50)
- [ ] `pnpm --filter web test`, `pnpm qa`, `pnpm build:web`
- [ ] `pnpm exec eve eval smoke` with isolated `EVE_EVAL_DATABASE_URL`
- [ ] Manual journeys A–F

## Demo walkthrough anchors (`CREWDAY_SMOKE_ANCHOR_IDS`)

| Key                     | UUID    | Use                              |
| ----------------------- | ------- | -------------------------------- |
| `sickCallCoverage`      | `…8101` | Journey A — coverage / sick call |
| `mergeVictimSwap`       | `…8202` | Journey B/C — merge target       |
| `openQueueSwapApproval` | `…8203` | Journey C — open queue           |
| `spanishNotification`   | `…8403` | Notifications / multilingual     |
| `payrollCanonical`      | `…8501` | Payroll cluster                  |
| `regionalCoverageOpen`  | `…8801` | Regional visibility              |
| `pendingConfirmPush`    | `…8907` | Intake / confirm gate            |

Full ids: `packages/fi/seed/crewday-scenario.ts`.

## Hosted database refresh (authorized only)

1. Confirm target `DATABASE_URL` and branch (`meta-cto`).
2. Backup or use disposable Neon branch.
3. Run migrations; destructive seed with `FI_SEED_ALLOW_DESTRUCTIVE=1` only when intended.
4. Verify no numbered bulk titles or eval leakage in UI.

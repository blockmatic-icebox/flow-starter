# Audit reconciliation — Simplified Flow starter

Date: 2026-10-26  
**Status:** Current  
**Last reviewed:** 2026-10-26

This document responds to the **Flow Factory — simple branch audit** dated 2026-10-26 that reviewed `simple` at `447de36c`. **Current product truth is `main` at merge commit `edfdefe42`** ([PR #8](https://github.com/gaboesquivel/flow-factory/pull/8), merged 2026-10-26). Re-verify against that SHA, not the pre-closeout snapshot.

## P0 blockers cited in the audit

| Audit claim | Status on `main` @ `edfdefe42` | Evidence |
| --- | --- | --- |
| PR merge conflicts / dirty | **Resolved** | PR #8 merged; `main` fast-forwarded |
| Vercel failures on HEAD | **Resolved** | `flow-starter` production READY (`edfdefe42`); `simple` preview READY (`ffdbc1827`); `meta-cto` skips `simple` via Ignored Build Step |
| No GitHub Actions on `simple` | **Stale** | Actions run on PRs to `main`; final PR run green (product, security, conventional commits) |
| Studio always refines after first compose | **Fixed** | Landing + starters call `submit(..., "create")`; sidebar **Send** uses `mode: "refine"` only; **New composition** clears envelope/messages/`q` ([`studio-client.tsx`](../../apps/web/app/_components/studio/studio-client.tsx)) |
| Deterministic examples blocked without `AI_GATEWAY_API_KEY` after first compose | **Fixed** | Same create/refine split; tier-1 routes do not require gateway |

## P1 requirements cited in the audit

| Audit claim | Status | Evidence |
| --- | --- | --- |
| `insufficient-data` → `outcome: "success"` | **Fixed** | [`compose.ts`](../../packages/genui/src/orchestration/compose.ts) sets `outcome: "failed"`, `failureCode: "unsupported_request"`; tests in `compose.test.ts`; grader in `grade-query-matrix.ts` |
| Jev not wired | **Implemented** | [`classify.ts`](../../packages/genui/src/orchestration/classify.ts) + dynamic `@typesafe-ai/sdk`; `TYPESAFE_API_KEY` optional with regex fallback; `classifier` metadata on stream schema |
| ARCHITECTURE says Jev not wired | **Stale** | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) documents Jev path |
| Old `flow-eval` slash command | **Removed from Cursor**; **`.claude/commands/flow-eval.md` deleted** in follow-up | Points at deleted skill |
| ADR 0001 vs Matt workflow | **Reconciled** | [ADR 0002](../adr/0002-matt-workflow-on-simple.md) supersedes day-to-day Factory router on the starter product; ADR 0001 still governs stack adoption |

## P1–P10 coverage (current)

| ID | Audit | Current assessment |
| --- | --- | --- |
| P1 | Pass* | Unchanged — assessment product removed from starter paths |
| P2 | Pass* | Shared `@repo/genui` for web, MCP, Eve |
| P3 | Fail (no Jev) | **Pass\*** for wiring; live Jev calls **unverified** without `TYPESAFE_API_KEY` in CI |
| P4 | Partial | Registered vocabulary + validation; richer plan/metric views (prices, features, bar chart) in [`views.tsx`](../../packages/genui/src/react/views.tsx) + [`acme-catalog.ts`](../../packages/genui/src/fixtures/acme-catalog.ts) |
| P5 | Partial | **Still partial** — protocol tests + MCP App bundle; **host rendering not observed** in a client; `/api/chat` is optional Anthropic sidebar, not compose |
| P6 | Pass* | Synthetic fixtures; optional Neon via Vercel (`DATABASE_URL`); compose path DB-free |
| P7 | Pass* | No app auth |
| P8 | Fail | **Pass\*** for unsupported + missing-credentials paths in code/tests; live MCP/Eve parity **unverified** |
| P9 | Partial | Contracts synced; Factory tree retained **by design** (ADR 0001); Matt process in ADR 0002 + README |
| P10 | Partial (default shadcn) | **Porcelain** tokens in [`globals.css`](../../packages/ui/src/styles/globals.css) + [`DESIGN.md`](../../DESIGN.md) |

\*Pass = evidenced in committed source/tests, not necessarily observed in production UI.

## Journeys and verification

| Journey | Code | Live / CI |
| --- | --- | --- |
| Support dashboard | Tier-1 + fixtures | Browser test added: starter chip → **Open tickets** visible |
| Pricing comparison | Plan cards with price/features/CTA | Unverified in browser |
| Onboarding form | Registered schema | Unverified in browser |
| Open-ended generation | Tier 3 + gateway | Requires `AI_GATEWAY_API_KEY`; `pnpm --filter @repo/genui eval:live` not in CI |
| Refine vs new composition | Envelope + turns to model on refine only | Browser test for **New composition** reset |
| Unsupported request | Failed outcome + warning UI | Offline matrix Q069–Q078 |
| MCP App host | `genui-preview.html` + resource tests | Host **unverified** |
| Eve `compose_ui` | Tool implementation | [`compose-ui.test.ts`](../../apps/web/tests/agent/compose-ui.test.ts) + [`compose-support-dashboard.eval.ts`](../../evals/smoke/compose-support-dashboard.eval.ts) call `.execute` |

**Offline 102/102** remains routing/schema coverage with `AI_GATEWAY_API_KEY` cleared — not generative quality proof. That distinction is intentional per spec.

## What remains honestly unverified

1. MCP App **host** rendering (not protocol tests alone).
2. Tier-3 / Jev **live model** behavior in deployed environments without keys.
3. Matt **GitHub Issues** multi-session trial (lockfile + docs only).
4. Full manual studio walkthrough on production URL (Vercel Deployment Protection may block unauthenticated API probes).

## Factory machinery

`.agents/flow/` and `.agents/eval/` remain for Factory parity (`pnpm ci:factory:local`). Product CI does not require the phase router. This matches ADR 0001 adoption, not an incomplete deletion.

## Commands to reproduce (Node 24+)

```bash
pnpm qa
pnpm eval:genui:offline
pnpm test:browser
pnpm exec eve eval smoke
```

Deployment: https://flow-starter-gaboesquivel.vercel.app/ (production, `main`).

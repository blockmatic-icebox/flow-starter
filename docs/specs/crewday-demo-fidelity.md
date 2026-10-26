# Spec — Crewday demo fidelity

**Last reviewed:** 2026-10-26  
**Status:** Current

Supersedes demo **volume** claims in [feature-intelligence-seed.md](./feature-intelligence-seed.md); that spec remains historical for the 500-row era.

**Related:** [initiative](../initiatives/crewday-demo-fidelity.md) · [tasks](../tasks/crewday-demo-fidelity.md) · [PRODUCT.md](../../PRODUCT.md)

## Purpose

Present **Hunch** as Feature Intelligence for a single demonstration product, **Crewday** (fictional workforce scheduling), using curated synthetic feedback—not bulk-generated placeholder text.

## Decided

| Topic | Decision |
| --- | --- |
| Product boundary | Hunch = FI system; Crewday = configured demo customer product (not a second app) |
| Dataset size | ~75–85 authored records (deterministic IDs, `SEED_REFERENCE_ISO` clock) |
| Tenancy | No project switcher, org tables, or multi-product infrastructure |
| Eval data | Must not share or pollute the demonstration database |
| Themes | Crewday taxonomy (see below); replaces analytics-oriented registry keys |

## Crewday canon

Source of truth: [`packages/fi/seed/crewday-scenario.ts`](../../packages/fi/seed/crewday-scenario.ts).

**Business priorities (synthetic demo criteria):**

1. Shift coverage reliability
2. Employee scheduling accuracy
3. Reduced scheduling administration
4. Labor and payroll correctness
5. Compliance and appropriate manager controls
6. Customer retention and expansion

Tradeoffs must be explicit in disposition rationales (e.g. high support but declined when manager approval is required).

## Theme taxonomy

| `theme_key`              | Label (example)          |
| ------------------------ | ------------------------ |
| `scheduling_coverage`    | Scheduling & coverage    |
| `shift_swaps`            | Shift swaps              |
| `availability_time_off`  | Availability & time off  |
| `notifications`          | Notifications            |
| `time_tracking_payroll`  | Time tracking & payroll  |
| `permissions_compliance` | Permissions & compliance |
| `mobile_reliability`     | Mobile & reliability     |
| `reporting_operations`   | Reporting & operations   |
| `platform_other`         | Platform / other         |

## Dataset quality requirements

- No numbered placeholder titles (`Request #12`), no “bulk seeded description”, no generic “Closed: decline” briefs
- Distinct personas and six fictional customer organizations, consistent across support keys and copy
- Eight connected scenario clusters (shift swaps, notifications, sick call, payroll, time off, permissions, mobile, regional visibility)
- Valid duplicate graph: existing targets, explanations, no self-reference or invalid merge cycles
- `support_count` equals distinct `supporter_keys` when keys are provided
- Evaluation-only titles must not appear in demo fixtures

## Persona / organization presentation

- Optional `demoContext` on seed rows; UUID-keyed map exported for UI (`getCrewdayDemoContextByRequestId`)
- No schema migration unless SQL-filterable org becomes a product requirement

## Seed safety

| Mode | Behavior |
| --- | --- |
| `pnpm seed:fi` | Destructive FI table reload (blocked in production unless `FI_SEED_ALLOW_DESTRUCTIVE=1`) |
| `FI_SEED_IF_EMPTY=1` | Load only when `feature_request` is empty (Vercel default) |
| Hosted refresh | Requires explicit authorization; document backup/rollback in tasks checklist |

Loader must use a transaction so partial failure cannot leave inconsistent FI tables.

## Testing requirements

- Domain, agent smoke, MCP, and GenUI tests use Crewday fixtures and isolated `EVE_EVAL_DATABASE_URL` (fail closed if unset)
- No new Playwright UI E2E suites

## Acceptance criteria

Aligned with Meta CTO assessment brief: Crewday context visible, believable feedback, honest duplicate retrieval limits, human approval before publish/disposition, starters grounded in persisted data, MCP App functional, docs synchronized.

## Excluded scope

Crewday product build, multi-project support, vector retrieval, auth/tenancy, unrelated Factory changes.

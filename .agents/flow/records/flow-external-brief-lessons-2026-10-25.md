# Flow — external brief and setup lessons

Date: 2026-10-25  
Evidence: Meta CTO dogfood session (Explore → Build in Flow Starter); coordinator retrospective + Flow Improve plan.

## Failure modes observed

| Gap | Symptom | Generic fix (shipped) |
| --- | --- | --- |
| Brief source | Fixture copy used before human-supplied brief | `flow` SKILL: read **human-supplied** brief first; reconcile with contracts |
| Repository fit | Product Build in dogfood while handoff expects separate repo | `flow` SKILL: **starter-neutral** → state checkout role before **Build** |
| Logging | Tracked prompt log left dirty git | Local gitignored logs only; Task report default ([journal.md](../operations/journal.md)) |
| Stage discipline | Plan file treated as contract; Build before Specify docs | **Explore → Specify** persistence with Decided / Assumed / Open |
| Setup | Logging/setup claimed without verification | **Setup readiness** checklist in `flow` SKILL |

## Changes

- [.agents/skills/flow/SKILL.md](../../skills/flow/SKILL.md) — coordinator bullets (brief, repo role, Specify gate, setup)
- [.agents/skills/flow-improve/SKILL.md](../../skills/flow-improve/SKILL.md) — generic rule + regression test step
- [prompt-log.md](../operations/prompt-log.md) — local prompt trail and employer-brief reconciliation (handoff)
- [check-flow-docs.mjs](../../tooling/checks/check-flow-docs.mjs) — `validateFlowCoordinatorContract`

## Still human judgment

- Dogfood in Flow Starter vs install new product repo.
- Employer logging filenames vs Flow conventions (local only).
- Time-box scope for timed exercises.
- Contract-edit approval for `PRODUCT.md` and product ADRs.

## Verification

Run `pnpm --dir .agents flow:check` and `pnpm --dir .agents flow:test` after integration.

# Initiative: Separated product tasks documents

**Status:** Accepted  
**Stage:** Shipped (methodology)  
**Trigger:** Product agents embedded Build checklists in `docs/initiatives/` instead of `docs/tasks/` (Flow default vs specs+tasks pattern).

## Outcome

Product Build backlogs live in **`docs/tasks/<slug>.md`**, linked from initiatives and specs—not inlined.

## Decided

- Register `docs/tasks/` in [flow.md](../flow.md) documentation ownership table.
- Operational contract: [operations/tasks-documents.md](../operations/tasks-documents.md).
- Mechanical guard: `validateSeparatedProductTasks` in `.agents/tooling/checks/check-flow-docs.mjs`.
- Coordinator skill references tasks-documents in Plan guidance.

## Verification

- `pnpm --dir .agents flow:check` — exit 0 (includes separated-tasks rules).
- Example product file: `docs/tasks/feature-intelligence.md`.

## Non-goals

- Renaming `docs/plans/` or removing initiative progress sections.
- Enforcing tasks files for one-line setup-only work.

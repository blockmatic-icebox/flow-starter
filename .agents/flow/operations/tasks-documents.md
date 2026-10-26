# Product tasks documents (`docs/tasks/`)

**Status:** Current (Factory operations)

## Purpose

Keep **execution checklists** separate from **requirements** and **initiative scope** so agents and humans can tick progress without rewriting specs (Addy Osmani _specs + tasks_ pattern).

| Document | Owns | Does not own |
| --- | --- | --- |
| `docs/specs/<slug>.md` | Behavior, acceptance, contracts | Checkbox backlog, commit-sized steps |
| `docs/initiatives/<slug>.md` | Outcome, Decided/Assumed, waves summary, progress | Full task tables, dependency matrices |
| `docs/tasks/<slug>.md` | Build checklist, dependencies, gates, `[ ]` / `[x]` | New product requirements |

**Slug rule:** `docs/tasks/<slug>.md` pairs with `docs/initiatives/<slug>.md` and usually `docs/specs/<slug>.md` (same `<slug>`).

## Coordinator rules (Plan → Build)

1. **Plan:** Create or update `docs/tasks/<slug>.md` when the initiative has a multi-step Build backlog. Put wave gates and **Depends on** in the tasks file.
2. **Initiative:** Link to `docs/tasks/<slug>.md` under `## Tasks (execution)` — one short paragraph + link only.
3. **Specs:** Link to the tasks file from the spec index if helpful; never embed `T-*-*` task tables in specs.
4. **Build:** Check boxes only in `docs/tasks/<slug>.md` unless a spec/initiative fact changed (then update the owning contract).
5. **Workers:** Read tasks file for scope; read specs for acceptance; do not add requirements in the tasks file.

## Anti-patterns

- Pasting a `| **T-0-1** |` task table into an initiative or spec.
- Using `docs/plans/` for checkbox backlogs when `docs/tasks/` is enough (plans remain for narrative plans when the initiative is insufficient).
- Duplicating the same checklist in initiative + tasks + spec.

## Verification

`pnpm --dir .agents flow:check` runs mechanical rules in `check-flow-docs.mjs` (`validateSeparatedProductTasks`).

## Related

- [flow.md § Documentation ownership](../flow.md#documentation-ownership)
- [delegation.md § Plan](delegation.md#plan)
- [worktrees.md](worktrees.md) — task ids in worker briefs

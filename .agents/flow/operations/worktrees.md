# Parallel worktrees

Host-agnostic coordination for multiple coding agents. [delegation.md](delegation.md) decides whether to fan out; this document owns gates, wave format, commands, and briefs. The initiative owns the wave graph; `pnpm worktrees` validates it, manages lifecycle state, and integrates verified results into local `main`. The agent host (Cursor CLI, and others) starts agents and passes each one the generated brief.

Worker roles map to task fields: **researcher** (`mode: question`, empty `writes`), **builder** (`mode: build`, `build_authorized: yes`), **verifier** (`mode: question`, `flow_stage: Review`, empty `writes`).

## When to use

- Substantial initiative work with independent tasks after planning
- Contrarian exploration before plan approval (question mode, read-only writes)
- Build waves after explicit **Build** authorization

Skip waves for a single-file fix with no `## Waves` section in the initiative.

After **Build** authorization, ready independent tasks run automatically in isolated worktrees. The coordinator verifies each result and serializes integration into local `main`. A task is complete only after integration and verification.

## Gates

1. **Explore / Specify** — canonical product docs update in the initiative or `PRODUCT.md`, not in question worktrees.
2. **Contrarian wave** — before plan approval on substantial work, run question-mode tasks (skills such as `idea-refine`, `problem-validation`) in separate worktrees. Parent records assumptions, kill criteria, and recommendation in the initiative.
3. **Plan** — dependency graph and waves live under `## Waves` in [docs/initiatives/<slug>.md](../initiatives/).
4. **Build** — build worktrees only when `build_authorized: yes` on that task and implementation is authorized.
5. **Review** — optional review worktree after the parent integrates a wave (`code-review-and-quality`).

Plan approval is not Build authorization.

## Task lifecycle

`pending` → `ready` → `running` → `verifying` → `ready-to-integrate` → `integrated`

Also `blocked` (merge conflict, dirty main, unmet prerequisite) and `failed` (worker or acceptance failure). State is stored under `.worktrees/state/<slug>.json` (gitignored).

`pnpm worktrees run` finishes with `ok: false` when any required task is `failed` or `blocked`, or not all tasks reached `integrated`. Question-mode workers must produce non-empty output; reports live under `.worktrees/reports/<slug>/<taskId>.json`. Command-worker runs use a bounded async pool (`FLOW_WORKTREE_CAPACITY`). Optional initiative line `integrated_acceptance: <command>` runs on the integration worktree after all tasks complete.

## Initiative wave format

Add a `## Waves` section to the initiative. Each `### Wave <name>` groups tasks that may run together after dependencies are satisfied.

Each task is a `#### task: <id>` block:

```markdown
#### task: api-types

- mode: build
- flow_stage: Build
- depends_on:
  - contract
- writes:
  - packages/api/src/types.ts
- reads:
  - AGENTS.md
  - ARCHITECTURE.md
- skills:
  - incremental-implementation
  - test-driven-development
- acceptance: pnpm --filter @repo/api test
- build_authorized: yes
```

### Fields

| Field | Required | Notes |
| --- | --- | --- |
| `mode` | yes | `question` (explore/contrarian) or `build` |
| `flow_stage` | yes | Explore, Specify, Plan, Build, or Review |
| `depends_on` | no | Task ids from earlier waves |
| `writes` | yes | Paths this agent may change; use `[]` for question mode |
| `reads` | yes | Docs to load for context |
| `skills` | yes | Installed skill ids from `skills-lock.json` |
| `acceptance` | build only | Shell command that must exit 0 |
| `build_authorized` | build only | Must be `yes` to create a build worktree |
| `schema_owner` | db only | Must be `yes` when writing under `packages/db/**` |

### Path rules

- Relative paths only; no `..`, globs, or absolute paths.
- Directory ownership is prefix-based (`pkg/src` owns `pkg/src/a.ts`).
- Concurrent tasks (no dependency path between them) must not overlap on `writes`.

### Parent-owned paths

Build tasks must not list these under `writes` (parent integrates them):

- `docs/initiatives/**`
- `pnpm-lock.yaml`
- `skills-lock.json`
- `**/knowledge-snapshot.ts`
- Database schema and migration files under `packages/db/**` unless the task sets `schema_owner: yes` and is the only schema owner for the initiative

Tasks in the same wave must not overlap on `writes` paths.

## Commands

From the repository root:

```bash
pnpm worktrees check <initiative-slug>
pnpm worktrees prepare <initiative-slug> [wave-name]
pnpm worktrees run <initiative-slug> [--host cursor] [--worker "<cmd>"]
pnpm worktrees status <initiative-slug>
pnpm worktrees cleanup <initiative-slug> [--force]
pnpm worktrees up <initiative-slug> <wave-name>    # alias: prepare wave
pnpm worktrees down <initiative-slug> <wave-name>  # safe cleanup for wave
```

- **check** — parse `docs/initiatives/<slug>.md`, validate skills, dependencies, cycles, write overlap, build authorization, and concurrent write rules.
- **prepare** / **up** — create worktrees for **ready** tasks (dependencies integrated). Optional wave filter still enforces prerequisites. Writes brief at `.worktrees/briefs/<slug>/<task-id>.md`.
- **run** — schedule workers, verify, and integrate into local `main`. Use `--host cursor` with the Cursor CLI (`agent --workspace <path>`). Use `--worker` for deterministic test/fixture workers. Does not push or open PRs.
- **status** — show persisted task lifecycle state.
- **cleanup** / **down** — remove integrated worktrees when clean; refuses dirty or unintegrated work unless `--force` (still never force-deletes unmerged work by default).

Branches: `wt/<slug>/<task-id>`. Worktrees: `.worktrees/<slug>/<task-id>`. `.worktrees/` is gitignored.

## Starting state

Task branches pin a base revision. Scoped dirty changes under a ready task’s `writes` may be captured in a local checkpoint commit without modifying the user’s index or unrelated files. Dependent tasks start from integrated `main`.

## Integration recovery

When integration marks a task `blocked` because of a merge conflict or conflict markers, the coordinator aborts the in-progress merge in the integration worktree so `main` is not left mid-merge. Fix the task branch (or abandon the task), then rerun `pnpm worktrees run`. Reverting an already integrated commit on `main` uses ordinary authorized git revert; there is no separate rollback command.

## Isolation limits

Worktrees isolate git checkouts, not external resources. Avoid shared dev ports and browser sessions; isolate test databases when required. Do not run worker migrations against shared production databases. Worktrees are not a security sandbox.

## Agent brief

Each brief is self-contained (subagents do not see parent chat). It includes initiative path, task id, flow stage, mode, base revision, `writes`, `reads`, `skills`, acceptance command (build tasks), and the return format from [delegation.md](delegation.md#worker-report).

For browser verification in a worktree, use a dedicated agent-browser session per [verification.md](verification.md).

## Skill seats (phase-aware)

Load only skills listed on the task. Typical assignments:

| Phase | Skills |
| --- | --- |
| Contrarian / Explore | `idea-refine`, `problem-validation` |
| Specify | `prd-writing`, `spec-driven-development`, `domain-modeling` |
| Plan | `planning-and-task-breakdown` |
| Build | `incremental-implementation`, `test-driven-development` plus technology skills from [skills.md](skills.md) |
| Review | `code-review-and-quality`, `deepsec` when security-sensitive |

Do not load the full catalog in one worktree.

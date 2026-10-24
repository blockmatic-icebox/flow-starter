# Parallel worktrees

Host-agnostic coordination for multiple coding agents. The initiative owns the wave graph; `pnpm worktrees` validates it and creates isolated git checkouts. The agent host (Cursor, Claude Code, VPC runner, and others) starts agents and passes each one the generated brief.

## When to use

- Substantial initiative work with independent tasks after planning
- Contrarian exploration before plan approval (question mode, read-only writes)
- Build waves after explicit **Build** authorization

Skip waves for a single-file fix with no `## Waves` section in the initiative.

## Gates

1. **Explore / Specify** — canonical product docs update in the initiative or `PRODUCT.md`, not in question worktrees.
2. **Contrarian wave** — before plan approval on substantial work, run question-mode tasks (skills such as `idea-refine`, `problem-validation`) in separate worktrees. Parent records assumptions, kill criteria, and recommendation in the initiative.
3. **Plan** — dependency graph and waves live under `## Waves` in [docs/initiatives/<slug>.md](../initiatives/).
4. **Build** — `pnpm worktrees up` creates build worktrees only when `build_authorized: yes` on that task.
5. **Review** — optional review worktree after the parent integrates a wave (`code-review-and-quality`).

Plan approval is not Build authorization.

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

### Parent-owned paths

Build tasks must not list these under `writes` (parent integrates them):

- `docs/initiatives/**`
- `pnpm-lock.yaml`
- `skills-lock.json`
- `**/knowledge-snapshot.ts`
- Database schema and migration files under `packages/db/**` unless the task is explicitly the schema owner for the wave

Tasks in the same wave must not overlap on `writes` paths.

## Commands

From the repository root:

```bash
pnpm worktrees check <initiative-slug>
pnpm worktrees up <initiative-slug> <wave-name>
pnpm worktrees down <initiative-slug> <wave-name>
```

- **check** — parse `docs/initiatives/<slug>.md`, validate skills, dependencies, cycles, write overlap, and build authorization.
- **up** — create branch `wt/<slug>/<task-id>` and worktree at `.worktrees/<slug>/<task-id>`. Write brief at `.worktrees/briefs/<slug>/<task-id>.md` (not on the task branch).
- **down** — remove worktrees for that wave after the parent has merged changes. Does not merge or push.

`.worktrees/` is gitignored.

## Agent brief

Each brief is self-contained (subagents do not see parent chat). It includes:

- Initiative path and task id
- Flow stage and mode
- `writes`, `reads`, `skills`
- Acceptance command (build tasks)
- Return format: files changed, commands with exit codes, blockers

For browser verification in a worktree, use a dedicated agent-browser session per [verify.md](verify.md).

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

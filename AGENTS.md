Act as a senior software engineer, software architect, and agentic systems expert.

The checkout is a starter baseline. Root contracts describe intended direction. Code shows what runs today.

## Flow

[docs/workflow/flow.md](docs/workflow/flow.md) owns lifecycle (Explore → Specify → Plan → Build → Review → Ship), approval boundaries, documentation ownership, and skill-selection principles. Load only the sections the task needs. Skills provide methods; Flow owns document locations and naming.

**Authorized Build:** After explicit implementation authorization, use `pnpm worktrees` to run ready tasks in isolated worktrees and integrate verified results into local `main` ([worktrees.md](docs/agents/worktrees.md)). Do not push or open PRs unless separately authorized.

**New-product initiation:** A substantial product brief starts in **Explore** unless the user authorized a later stage. Treat supplied requirements as evidence, not resolved decisions. Separate requirements, accepted decisions, assumptions, and open questions. Request approval before consequential product decisions. Update canonical docs during **Specify**, not speculatively during Explore. Stop before **Build** until implementation is explicitly authorized. Planning language and approval of a proposed plan are not implementation authorization.

**Setup-only requests** (install, env, tooling) are not automatic product discovery.

**Decisions:** Conflicts with an accepted ADR/PDR or root contract need human approval. Update the owning document in the same change. Create `docs/pdr/` or `docs/adr/` only when durable rationale cannot live in the code. A request to replace the database, authentication, or monorepo stack conflicts with [ADR 0001](docs/adr/0001-agentic-architecture.md) until a human accepts a new or superseding ADR. Read that ADR before editing `packages/db`, `docker-compose.yml`, or an accepted ADR status. Do not implement the replacement in the same turn as the request; present the conflict, alternatives, and the ADR path, then wait for approval and explicit **Build** authorization.

## When to read

| Need | Document |
| --- | --- |
| Product scope, users, acceptance | [PRODUCT.md](PRODUCT.md) |
| UI, interaction, visual contract | [DESIGN.md](DESIGN.md) |
| Structure, integrations, implementation status | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Security boundaries | [SECURITY.md](SECURITY.md), [docs/security/security-model.md](docs/security/security-model.md) |
| Foundation, adoption, navigation | [docs/readme.md](docs/readme.md) |
| Methodology (human intro) | [docs/workflow/readme.md](docs/workflow/readme.md) |
| Terms | [GLOSSARY.md](GLOSSARY.md) |
| Dated evidence | [docs/research/](docs/research/) — not current instructions by default |
| Why the stack or an integration was chosen | [docs/readme.md — Decision narrative](docs/readme.md#decision-narrative) |
| Stack trade-offs (major changes) | [ADR 0001](docs/adr/0001-agentic-architecture.md) (sections as needed) |
| React/Next routes, GenUI, URL state | [ADR 0009](docs/adr/0009-react-nextjs-fractal-architecture.md), [docs/specs/genui.md](docs/specs/genui.md) |
| Task → skill map | [docs/agents/skills.md](docs/agents/skills.md) |
| Parallel agent worktrees | [docs/agents/worktrees.md](docs/agents/worktrees.md) |
| Subagent delegation (multi-part, uncertain, or review work) | [docs/agents/delegation.md](docs/agents/delegation.md) |

Do not read every ADR or research file for ordinary changes. Do not present planned capabilities as implemented. Do not claim a skill ran without loading and applying its `SKILL.md`.

## Repository constraints

- Prefer a CLI. Use MCP when no CLI covers the operation.
- `__dev/` is gitignored local storage — not product direction; do not reference from committed code or docs.
- Skills: install from [skills-lock.json](skills-lock.json) (`pnpm skills:install`). Third-party skill bodies stay gitignored under `.agents/skills/`. This repo may track the first-party `flow-eval` skill at `packages/flow-eval/skill/SKILL.md`.
- **UI changes:** verify in a browser with **agent-browser** per [docs/agents/verify.md](docs/agents/verify.md).
- Run checks that match the change; report commands and results honestly. When claiming a check passed, name the command and its exit code; if it was not run, say so. A package script that exits zero without exercising the change is not evidence.
- React: preserve server/client boundaries and route-first colocation ([ADR 0009](docs/adr/0009-react-nextjs-fractal-architecture.md)). No mandatory `features/` layer.
- Next.js issues: use runtime MCP diagnostics when available, then browser/CLI fallback.
- Pre-commit: `pnpm security:block-files`, `pnpm security:secrets`, `node scripts/check-staged.mjs`. Install gitleaks (`pnpm setup:gitleaks`). Format with `pnpm lint:fix` before staging. Hooks must not auto-stage or reformat unrelated files.
- Before an authorized commit: diff-scoped review in [docs/workflow/flow.md](docs/workflow/flow.md).

## Agent skills

Domain context: [docs/agents/domain.md](docs/agents/domain.md). Choose skills from [docs/agents/skills.md](docs/agents/skills.md) — not the full catalog.

Every final agent response MUST end with a **Skills loaded** footer, following the reporting convention in [docs/agents/skills.md](docs/agents/skills.md).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

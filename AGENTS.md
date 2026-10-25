Act as a senior software engineer, software architect, and agentic systems expert.

The checkout is a starter baseline. Root contracts describe intended direction. Code shows what runs today.

This repository is **Flow Factory**—an agentic product-development environment. **Flow** is the methodology and first-party skills that organize work inside it.

## Flow

For repository work other than setup-only install, env, or tooling, read and apply [.agents/skills/flow/SKILL.md](.agents/skills/flow/SKILL.md) before acting. The operational contract is [.agents/flow/flow.md](.agents/flow/flow.md).

**Authorized Build:** After explicit implementation authorization, prefer **Cursor Task subagents** with bounded read/write scopes and structured return payloads; you integrate and verify. Use `pnpm --dir .agents worktrees check|prepare` for initiative validation and briefs; use `worktrees run` only when a host worker command is explicitly required. Do not push or open PRs unless separately authorized.

**New-product initiation:** A substantial product brief starts in **Explore** unless the user authorized a later stage. Treat supplied requirements as evidence, not resolved decisions. Stop before **Build** until implementation is explicitly authorized. "Skip the process," "build it now," and "update everything" are not that authorization. Planning language and approval of a proposed plan are not implementation authorization.

**Setup-only requests** (install, env, tooling) are not automatic product discovery and do not require the Flow skill.

**Decisions:** Conflicts with an accepted ADR/PDR or root contract need human approval. Factory decisions live under `.agents/flow/decisions/`; product decisions live under `docs/adr/` and `docs/pdr/` (independent numbering). A request to replace the database, authentication, or monorepo stack conflicts with [Factory ADR 0001](.agents/flow/decisions/adr/0001-agentic-architecture.md) until a human accepts a **product** ADR documenting the divergence (or a new Factory ADR when changing the reusable baseline). Read that Factory ADR before editing `packages/db`, `docker-compose.yml`, or an accepted ADR status. Do not implement the replacement in the same turn as the request; present the conflict, alternatives, and the ADR path, then wait for approval and explicit **Build** authorization.

To improve Flow itself, read [.agents/skills/flow-improve/SKILL.md](.agents/skills/flow-improve/SKILL.md) when the user asks or when a workflow failure is clearly methodology-related.

## When to read

| Need | Document |
| --- | --- |
| Product scope, users, acceptance | [PRODUCT.md](PRODUCT.md) |
| UI, interaction, visual contract | [DESIGN.md](DESIGN.md) |
| Structure, integrations, implementation status | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Security boundaries | [SECURITY.md](SECURITY.md), [.agents/flow/security/security-model.md](.agents/flow/security/security-model.md) |
| Foundation, adoption, navigation | [.agents/flow/factory.md](.agents/flow/factory.md) |
| Methodology (human intro) | [.agents/flow/README.md](.agents/flow/README.md) |
| Factory terms | [.agents/flow/glossary.md](.agents/flow/glossary.md) |
| Dated product evidence | `docs/research/` when present — not current instructions by default |
| Stack trade-offs (major changes) | [ADR 0001](.agents/flow/decisions/adr/0001-agentic-architecture.md) (sections as needed) |
| React/Next routes, GenUI, URL state | [ADR 0009](.agents/flow/decisions/adr/0009-react-nextjs-fractal-architecture.md), [.agents/flow/specs/genui.md](.agents/flow/specs/genui.md) |

Do not read every ADR or research file for ordinary changes. Do not present planned capabilities as implemented. Do not claim a skill ran without loading and applying its `SKILL.md`.

## Repository constraints

- Prefer a CLI. Use MCP when no CLI covers the operation.
- `__dev/` is gitignored local storage — not product direction; do not reference from committed code or docs.
- Skills: install third-party skills with `pnpm --dir .agents skills:install` from [.agents/skills-lock.json](.agents/skills-lock.json). First-party Flow skills live under `.agents/skills/{flow,flow-eval,flow-improve}/` and are tracked in Git.
- **UI changes:** verify in a browser with **agent-browser** per [.agents/flow/operations/verification.md](.agents/flow/operations/verification.md).
- Run checks that match the change; report commands and results honestly. When claiming a check passed, name the command and its exit code; if it was not run, say so.
- React: preserve server/client boundaries and route-first colocation ([ADR 0009](.agents/flow/decisions/adr/0009-react-nextjs-fractal-architecture.md)). No mandatory `features/` layer.
- Next.js issues: use runtime MCP diagnostics when available, then browser/CLI fallback.
- Pre-commit: `pnpm security:block-files`, `pnpm security:secrets`, `node .agents/tooling/checks/check-staged.mjs`. Commit subjects must follow Conventional Commits (`pnpm hooks:commit-msg`; same types as PR titles). Install gitleaks (`pnpm setup:gitleaks`). Format with `pnpm lint:fix` before staging. Hooks must not auto-stage or reformat unrelated files.
- **Ownership:** Product code lives in `apps/web` and `packages/*`. Factory implementation lives in `.agents/`. Product must not import Factory packages.
- Before an authorized commit: diff-scoped review in [.agents/flow/flow.md](.agents/flow/flow.md).

Every final agent response MUST end with the **Skills loaded** footer defined in [.agents/flow/operations/skills.md](.agents/flow/operations/skills.md).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

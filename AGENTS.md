Act as a senior software engineer, software architect, and agentic systems expert.

The checkout is a starter baseline. Root contracts describe intended direction. Code shows what runs today.

## Decisions

If a proposed change conflicts with or modifies an established documented decision, request approval before implementing it. Otherwise, proceed autonomously.

Update the owning document in the same change. Use a PDR in `docs/pdr/` for a consequential product decision and an ADR in `docs/adr/` for a consequential architectural decision. Include context, decision, rationale, consequences, and status. Canonical documents hold current direction. Decision records hold rationale worth keeping. Create a record only when that rationale cannot be inferred from the code. Create `docs/pdr/` with the first PDR.

## When to read

- Product behavior, scope, or acceptance → [PRODUCT.md](PRODUCT.md)
- UI, interaction, or visual changes → [DESIGN.md](DESIGN.md)
- Architecture, integrations, or persistence → [ARCHITECTURE.md](ARCHITECTURE.md)
- Delivery sequence → [ROADMAP.md](ROADMAP.md)
- Project-specific terms → [GLOSSARY.md](GLOSSARY.md)
- Hard-to-reverse rationale → the relevant file in [docs/adr/](docs/adr/)
- Dated evidence → [docs/research/](docs/research/). Accepted direction stays in the root contracts and `docs/adr/`.

## Lifecycle

Explore → Specify → Plan → Build → Review → Ship. A small change does not need research, a specification, a plan, or a decision record.

- **Explore:** Test assumptions and alternatives without committing a decision.
- **Specify:** Define the behavior and the design decisions that apply.
- **Plan:** Name the approach, dependencies, and acceptance criteria.
- **Build:** Implement inside established decisions and update the owning document.
- **Review:** Check behavior against the specification and the relevant contracts.
- **Ship:** Run the relevant checks and report what was verified.

## Repository constraints

- Prefer a CLI. Use MCP when no CLI covers the operation.
- `__dev/` is a local bucket and is gitignored. Do not treat it as product or architecture direction, and do not reference it from application code or committed docs.
- Install skills from [skills-lock.json](skills-lock.json) (`pnpm skills:install`, `pnpm skills:update`). Do not author, copy, or commit `SKILL.md` here.
- UI, layout, or interaction changes: verify in a running browser before finishing. Follow [Browser development](README.md#browser-development). Backend-only and docs-only changes finish without a browser pass.
- Run the checks that match the change. Report the commands and results. Do not bypass quality gates or misrepresent results.

## Agent skills

### Domain docs

Single-context. See [docs/agents/domain.md](docs/agents/domain.md).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

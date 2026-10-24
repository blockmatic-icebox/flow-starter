Act as a senior software engineer, software architect, and agentic systems expert.

The checkout is a starter baseline. Root contracts describe intended direction. Code shows what runs today.

## Flow workflow

[docs/workflow/flow.md](docs/workflow/flow.md) defines the agent-agnostic workflow, skill-selection rules, and documentation conventions. Load the relevant sections when planning substantial work, using specialized skills, or changing documentation. Skills provide methods; Flow owns document locations, naming, and lifecycle. Use progressive disclosure: do not read every linked document by default.

## Decisions

If a proposed change conflicts with or modifies an established documented decision, request approval before implementing it. Otherwise, proceed autonomously.

Update the owning document in the same change. Use a PDR in `docs/pdr/` for a consequential product decision and an ADR in `docs/adr/` for a consequential architectural decision. Include context, decision, rationale, consequences, and status. Canonical documents hold current direction. Decision records hold rationale worth keeping. Create a record only when that rationale cannot be inferred from the code. Create `docs/pdr/` with the first PDR.

## When to read

- Product behavior, scope, or acceptance → [PRODUCT.md](PRODUCT.md)
- UI, interaction, or visual changes → [DESIGN.md](DESIGN.md)
- Architecture, integrations, or persistence → [ARCHITECTURE.md](ARCHITECTURE.md)
- Security boundaries → [SECURITY.md](SECURITY.md) and [docs/security/security-model.md](docs/security/security-model.md)
- Flow Starter's inherited foundation, goals or adoption guidance → [docs/readme.md](docs/readme.md).
- Human-facing explanation of Flow → [docs/workflow/readme.md](docs/workflow/readme.md). Operational rules remain in [docs/workflow/flow.md](docs/workflow/flow.md).
- Project-specific terms → [GLOSSARY.md](GLOSSARY.md)
- Hard-to-reverse rationale → the relevant file in [docs/adr/](docs/adr/)
- Architecture-wide technology choice, platform trade-offs, or major integration change → read the relevant sections of [ADR 0001](docs/adr/0001-agentic-architecture.md).
- React components, Next.js routes, UI features, URL state, component extraction, shared UI, or GenUI rendering → read the relevant sections of [ADR 0009](docs/adr/0009-react-nextjs-fractal-architecture.md) and inspect the affected package's installed framework documentation.
- Dated evidence → [docs/research/](docs/research/). Accepted direction stays in the root contracts and `docs/adr/`.

## Lifecycle

Use [docs/workflow/flow.md](docs/workflow/flow.md) for Explore → Specify → Plan → Build → Review → Ship, proportional gates, skill selection, and documentation ownership. Small changes may move directly through Build → Review → Ship.

## Repository constraints

- Prefer a CLI. Use MCP when no CLI covers the operation.
- `__dev/` is a local bucket and is gitignored. Do not treat it as product or architecture direction, and do not reference it from application code or committed docs.
- Install skills from [skills-lock.json](skills-lock.json) (`pnpm skills:install`, `pnpm skills:update`). Do not author, copy, or commit `SKILL.md` here.
- UI, layout, or interaction changes: verify in a running browser before finishing with **agent-browser** per [docs/agents/verify.md](docs/agents/verify.md). Backend-only and docs-only changes finish without a browser pass.
- Run the checks that match the change. Report the commands and results. Do not bypass quality gates or misrepresent results.
- React application changes must preserve server/client boundaries and the established fractal component architecture. Use relevant installed skills, not all technical skills at once.
- For Next.js development issues, use the framework's runtime MCP diagnostics when available; then verify relevant behavior in the browser. If runtime tools are unavailable, report that limitation and use the established CLI/browser fallback.
- Pre-commit runs `pnpm security:block-files`, `pnpm security:secrets`, then `node scripts/check-staged.mjs`. It does not run Playwright, the production build, or `pnpm qa`. Install gitleaks via `pnpm setup:gitleaks` before committing. Format deliberately with `pnpm lint:fix` before staging. Hooks must never stage files or reformat unrelated working-tree changes automatically.
- Before an explicitly authorized commit, follow the diff-scoped review in [docs/workflow/flow.md](docs/workflow/flow.md).

## Agent skills

### Domain docs

Single-context. See [docs/agents/domain.md](docs/agents/domain.md).

Choose skills from [docs/agents/skills.md](docs/agents/skills.md). Do not load the full catalog for a task.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

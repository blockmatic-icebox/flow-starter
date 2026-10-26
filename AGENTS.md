# Agents

Read [.agents/flow/flow.md](.agents/flow/flow.md) for shared conventions. Apply these directly to ordinary work; `/flow` is a thin entry point, not a required ceremony or orchestration framework.

## Current truth

| Document | Use |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Starter scope, users and desired outcomes |
| [DESIGN.md](DESIGN.md) | Journeys and default shadcn studio layout |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Packages, commands, env, MCP/GenUI boundaries |
| [docs/decisions/](docs/decisions/) | One active sequence for product, design and technical decisions |
| [docs/specs/001-lean-agentic-starter.md](docs/specs/001-lean-agentic-starter.md) | Existing starter requirements |

Start consequential product decisions with the user, problem, desired outcome and evidence. Keep assumptions explicit; choose solutions after examining alternatives. Update current contracts only when their intent or verified implementation changes.

## Agent skills

Use Matt Pocock's relevant installed skills; check actual files and dependencies before claiming availability. See [README — Matt Pocock workflow](README.md#matt-pocock-workflow).

- **Issue tracker:** GitHub Issues; see [tracker configuration](docs/agents/issue-tracker.md).
- **Domain docs:** Optional root glossary and unified `docs/decisions/`; see [domain configuration](docs/agents/domain.md). Override upstream ADR/PDR paths with this location.
- **`/f-extract`:** [Extract reusable starter capabilities](.agents/skills/f-extract/SKILL.md).
- **`/f-ship`:** [Check, commit, push and verify deployment](.agents/skills/f-ship/SKILL.md).

The previous `/f-yolo` name is replaced by `/f-ship`. Clients without slash discovery can read the linked `SKILL.md` directly. Keep first-party skills tracked; do not commit third-party installations.

## Product code and verification

`apps/web` owns the studio, MCP and GenUI API; reusable packages live in `packages/genui`, `packages/ui`, and `packages/db`. `agent/` holds Eve tools, not duplicate business logic outside `@repo/genui`.

Run checks matching the change and report commands and exit codes. UI route changes need browser smoke via `pnpm test:browser`. Product release parity is `pnpm ci:local`; Factory tooling changes also use `pnpm --dir .agents check:factory` and `pnpm --dir .agents test`. Preserve existing changes and never include unrelated files or ahead commits in a shipment without authorization.

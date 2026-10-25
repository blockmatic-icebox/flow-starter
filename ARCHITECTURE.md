# Architecture

> Product technical contract for this starter. [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are adopter-owned templates. Product decisions: [docs/adr/](docs/adr/).

This product **inherits [Flow Factory](.agents/flow/factory.md)**—methodology, skills, evaluation, and default security and GenUI boundaries. Factory-wide rationale lives under [.agents/flow/](.agents/flow/); see [.agents/flow/architecture.md](.agents/flow/architecture.md) for the full inherited technical architecture.

**Adoption:** [Product ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md).

## Application

| Path | Role |
| --- | --- |
| `apps/web` | **Product starter** — minimal homepage and the default place to build your product |

Shared workspace packages (`@repo/genui`, `@repo/db`, `@repo/ui`, `@repo/ts`) are available when the product needs them.

## What the product owns

Document here:

- Product-specific routes, APIs, and data models as you add them.
- Deviations from inherited Factory defaults (each consequential deviation needs an accepted product ADR referencing the relevant Factory ADR).
- Product authentication, authorization, and domain capabilities once implemented.

Do not duplicate the Factory stack-selection narrative or the full GenUI specification; link instead.

## Inherited boundaries (summary)

When you extend this starter, these Factory contracts still apply unless a **product ADR** explicitly overrides them:

- **React / Next.js:** route-first colocation, Server Components by default — [Factory ADR 0009](.agents/flow/decisions/adr/0009-react-nextjs-fractal-architecture.md).
- **GenUI:** validated OpenUI Lang in `@repo/genui` — [Factory spec](.agents/flow/specs/genui.md), [Factory ADR 0003](.agents/flow/decisions/adr/0003-genui-openui-foundation.md).
- **Public APIs and agents:** bounded inputs, host-owned actions, fail-closed production limits — [security model](.agents/flow/security/security-model.md), [Factory ADR 0011](.agents/flow/decisions/adr/0011-api-and-agent-security-boundaries.md).
- **Capability-first interfaces:** [Factory PDR 0001](.agents/flow/decisions/pdr/0001-agnostic-api-first.md).

Replacing the database layer, authentication stack, or monorepo layout conflicts with [Factory ADR 0001](.agents/flow/decisions/adr/0001-agentic-architecture.md) until a human accepts a new **product** ADR and any required Factory process for upstream changes.

## Repository layout (product view)

```text
apps/web/          # your product (extend here)
packages/          # shared libraries (use as needed)
docs/adr/          # product architecture decisions
PRODUCT.md         # product vision and scope
DESIGN.md          # experience direction
.agents/           # Flow Factory (methodology, eval, tooling — not product code)
```

## Quality gates

Local verification used in this repo:

- `pnpm qa` — documentation, architecture boundaries, lint, types, unit tests, schema check.
- `pnpm flow:check` — Flow and product documentation conventions (delegates to Factory).
- `pnpm architecture:check` — React import and client-boundary rules.

Factory integrity and evaluation: `pnpm --dir .agents check` and `pnpm --dir .agents test`.

UI changes: [.agents/flow/operations/verification.md](.agents/flow/operations/verification.md).

## Adoption and Factory navigation

- Factory overview: [.agents/flow/factory.md](.agents/flow/factory.md)
- Workflow contract: [.agents/flow/flow.md](.agents/flow/flow.md)
- Human intro: [.agents/flow/README.md](.agents/flow/README.md)
- Factory glossary: [.agents/flow/glossary.md](.agents/flow/glossary.md)

Update this file when **product** implementation or intentional deviations materially change.

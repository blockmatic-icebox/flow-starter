# Flow GenUI — technical specification

**Last reviewed:** 2026-10-24

**Status:** Current

Historical source mapping: [20261024-genui-extraction-inventory.md](../research/20261024-genui-extraction-inventory.md). Comparative representation research: [20261024-genui-json-vs-openui.md](../research/20261024-genui-json-vs-openui.md).

## Product integration surface (`apps/web`)

The template ships GenUI **runtime** in `@repo/genui`, not a pre-wired demo route. Adopters add product-owned surfaces when needed:

| Surface | Typical location |
| --- | --- |
| GenUI page or embedded experience | `apps/web/app/...` (route-first colocation) |
| Compose API | `apps/web/app/api/genui/compose/route.ts` (or equivalent) |
| Route-local adapters | `apps/web/app/_lib/genui/` (caps, compose context, schemas) |
| Browser tests | `apps/web/tests/browser/` |

A separate Flow demonstration application existed before [ADR 0014](../decisions/adr/0014-web-only-product-application.md); its routes are not part of the current layout.

## Three-level strategy

| Level | Name | When | Implementation (`packages/genui`) |
| --- | --- | --- | --- |
| 1 | Controlled | Recognized intents | `orchestration/routing.ts` + deterministic builders |
| 2 | Declarative | Compound or mixed requests | `SectionStack` + validated child OpenUI expressions |
| 3 | Open-ended answer | No controlled or declarative match | Optional model-backed prose in a validated Answer experience; grounded fallback when AI Gateway credentials are absent |

Tier 3 is not arbitrary runtime generation of React components or unconstrained interface trees. Presentation stays within approved OpenUI Lang contracts and host-controlled renderers.

Pipeline: **select → build OpenUI text → compile and validate → emit validated NDJSON → validate the inbound stream → render**. An invalid envelope is not emitted as `partial` or `complete`, and `GenuiRenderer` refuses an envelope the compiler rejects. The Flow client aborts the previous submission and ignores events for older request ids.

## Package layout

```text
packages/genui/src/
  core/           # envelope, limits, tiers, action registry
  registry/       # component names, composites, semantics, composition guidance
  contract/       # Zod props, OpenUI library, compiler, validation
  orchestration/  # composeQuery, builders, NDJSON stream helpers
  fixtures/       # Acme Analytics catalog (domain-neutral)
  react/          # host adapter (@repo/genui/react)
  eval/           # 100+ prompt matrix for CI
```

## Extending

1. Register new Zod props in `contract/schemas.ts` (`componentPropsByName` is the name source for `registry/components.ts`).
2. Register the contract noop in `contract/library.ts`.
3. Add composite allowlists in `contract/catalog.ts`.
4. Add semantics in `registry/semantics.ts`.
5. Implement React view in `react/views.tsx` and register in `react/library.tsx` (same component name as the contract).
6. Add controlled intent rules in `orchestration/routing.ts` (tier 1) or builder helpers (tier 2).

`registry/library-parity.test.ts` fails if the contract library advertises a component the React library does not register. `SectionStack` children render through OpenUI `useRenderNode` so every registered child component can compose declaratively.

Privileged actions: `createActionRegistry()` — never accept callbacks from model output.

## Tests

```bash
pnpm --filter @repo/genui test
pnpm eval:genui:offline
pnpm test:browser
```

`pnpm qa` runs GenUI unit tests; `pnpm ci:local` adds product browser tests when present. Pre-commit does not run Playwright.

| Layer | Location | What it proves |
| --- | --- | --- |
| Contract + compose | `packages/genui/src/**/*.test.ts` | Compiler, routing, validation-before-emit, NDJSON limits, `composeQuery`, 100+ graded prompts (no API keys) |
| Offline eval | `pnpm eval:genui:offline` | Same matrix as a JSON report |
| Product HTTP boundaries | `apps/web/app/_lib/**/*.test.ts` (when added) | Compose and security adapters in the product app |
| Product browser | `apps/web/tests/browser/` (when added) | End-to-end GenUI flows |

**While coding:** Playwright for regression; agent-browser for exploratory UI ([.agents/flow/operations/verification.md](../operations/verification.md)); `pnpm mcp:next` for App Router runtime issues.

**Planned gates (not default):** Eve `defineEval` + scripted models; MCP Apps host when the product implements readiness gates; auth E2E when Better Auth ships; live Promptfoo opt-in only.

`pnpm setup:playwright` installs Chromium. Use `PLAYWRIGHT_SKIP_WEBSERVER=1` and `PLAYWRIGHT_BASE_URL` to attach to an existing lab server.

## Host adapters

- **Product app:** `@repo/genui/react` `GenuiRenderer` + design tokens from `@repo/ui`.
- **MCP Apps / external hosts:** Reuse the same `CompositionEnvelope` and compiler; add an iframe bundle adapter when a `/dev` workspace ships (see extraction inventory for the source harness pattern).

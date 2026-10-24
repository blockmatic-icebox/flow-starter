# Flow GenUI — portable architecture

**Last reviewed:** 2026-10-24

**Status:** Current

Evidence-based extraction from gaboesquivel.com (read-only source) into `@repo/genui`. See [inventory.md](./inventory.md) for historical source-to-target mappings and snapshot evidence.

## Three-level strategy

| Level | Name | When | Flow implementation |
| --- | --- | --- | --- |
| 1 | Controlled | Recognized intents | `orchestration/routing.ts` + deterministic builders |
| 2 | Declarative | Compound or mixed requests | `SectionStack` + validated child OpenUI expressions |
| 3 | Open-ended answer | No controlled or declarative match | Optional model-backed prose in a validated Answer experience; grounded fallback when AI Gateway credentials are absent |

Tier 3 is not arbitrary runtime generation of React components or unconstrained interface trees. The implementation keeps presentation within approved OpenUI Lang contracts and host-controlled renderers.

Pipeline: **route → build OpenUI text → `compileCompositionEnvelope` → stream NDJSON → React `Renderer`**.

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

1. Register new Zod props in `contract/schemas.ts` and `contract/library.ts`.
2. Add composite allowlists in `contract/catalog.ts`.
3. Add semantics in `registry/semantics.ts`.
4. Implement React view in `react/views.tsx` and register in `react/library.tsx`.
5. Add controlled intent rules in `orchestration/routing.ts` (tier 1) or builder helpers (tier 2).

Privileged actions: `createActionRegistry()` — never accept callbacks from model output.

## Demo

- UI: `/genui-demo`
- API: `POST /api/genui/compose` (NDJSON, same event shape as source compose route)

## Tests

```bash
pnpm --filter @repo/genui test
pnpm --filter web test
pnpm eval:genui:offline
pnpm test:browser
```

`pnpm qa` runs GenUI and web unit tests; `pnpm ci:local` adds browser tests. Pre-commit does not run Playwright.

| Layer | Location | What it proves |
| --- | --- | --- |
| Contract + compose | `packages/genui/src/**/*.test.ts` | Compiler, routing, `composeQuery`, 100+ prompt matrix (no API keys) |
| Offline eval | `pnpm eval:genui:offline` | Same matrix as a JSON report |
| MCP protocol | `apps/web/lib/consultant/mcp-protocol.test.ts` | JSON-RPC on the same handler as `/api/mcp` |
| Fixture lab | `apps/web/tests/browser/fixture-lab.spec.ts` | Acme envelopes render without horizontal overflow |
| Product shell | `genui-demo.spec.ts`, `consultant-shell.spec.ts` | Demo + consultant chrome (compose mocked where needed) |

**Fixture lab:** `/__genui__/fixtures/:fixtureId` when `GENUI_FIXTURE_LAB=1` (not on Vercel). IDs in `packages/genui/src/fixtures/lab-fixtures.ts`. Playwright uses port **3199** (`apps/web/scripts/playwright-webserver.sh`).

**While coding:** Playwright for regression; agent-browser for exploratory UI ([README browser development](../../../README.md#browser-development)); next-devtools-mcp for App Router runtime issues.

**Planned gates (not default):** Eve `defineEval` + scripted models (basilic); MCP Apps host when `MCP_APP_GENUI_UI_READY` is true (`apps/web/lib/mcp/mcp-app-readiness.ts`); auth E2E when Better Auth ships; live Promptfoo opt-in only.

`pnpm setup:playwright` installs Chromium. Use `PLAYWRIGHT_SKIP_WEBSERVER=1` and `PLAYWRIGHT_BASE_URL` to attach to an existing lab server.

## Host adapters

- **Web:** `@repo/genui/react` `GenuiRenderer` + design tokens from `@repo/ui`.
- **MCP Apps / external hosts:** Reuse the same `CompositionEnvelope` and compiler; add an iframe bundle adapter when `/dev` workspace ships (pattern: source `tests/genui/mcp-apps` harness — ADAPT, not copied).

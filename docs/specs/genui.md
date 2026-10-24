# Flow GenUI — technical specification

**Last reviewed:** 2026-10-24

**Status:** Current

Historical source mapping: [20261024-genui-extraction-inventory.md](../research/20261024-genui-extraction-inventory.md). Comparative representation research: [20261024-genui-json-vs-openui.md](../research/20261024-genui-json-vs-openui.md).

## Integration surface (`apps/flow`)

| Surface | Path |
| --- | --- |
| GenUI demo UI | `apps/flow/app/page.tsx` → `/` |
| Compose API | `apps/flow/app/api/genui/compose/route.ts` |
| Flow Agent chat | `apps/flow/app/api/chat/route.ts` |
| Flow Agent MCP | `apps/flow/app/api/mcp/route.ts` |
| Fixture lab page | `apps/flow/app/genui-lab/fixtures/[fixtureId]/page.tsx` |
| Fixture rewrite | `/__genui__/fixtures/:fixtureId` → lab route (`apps/flow/next.config.ts`) |
| Route-local adapters | `apps/flow/app/_lib/genui/` (caps, compose context, schemas) |
| Browser tests | `apps/flow/tests/browser/` |

The product app (`apps/web`) does not host GenUI or Flow Agent routes. Adopters implement product UI there without inheriting demo APIs.

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

1. Register new Zod props in `contract/schemas.ts` and `contract/library.ts`.
2. Add composite allowlists in `contract/catalog.ts`.
3. Add semantics in `registry/semantics.ts`.
4. Implement React view in `react/views.tsx` and register in `react/library.tsx`.
5. Add controlled intent rules in `orchestration/routing.ts` (tier 1) or builder helpers (tier 2).

Privileged actions: `createActionRegistry()` — never accept callbacks from model output.

## Tests

```bash
pnpm --filter @repo/genui test
pnpm --filter flow-app test
pnpm eval:genui:offline
pnpm test:browser:flow
```

`pnpm qa` runs GenUI and Flow unit tests; `pnpm ci:local` adds browser tests. Pre-commit does not run Playwright.

| Layer | Location | What it proves |
| --- | --- | --- |
| Contract + compose | `packages/genui/src/**/*.test.ts` | Compiler, routing, validation-before-emit, NDJSON limits, `composeQuery`, 100+ graded prompts (no API keys) |
| Offline eval | `pnpm eval:genui:offline` | Same matrix as a JSON report |
| Compose route | `apps/flow/app/_lib/genui/compose-route.test.ts` | HTTP compose boundary |
| MCP protocol | `apps/flow/app/_lib/flow-agent/mcp-protocol.test.ts` | JSON-RPC on the MCP handler |
| MCP access | `apps/flow/app/_lib/security/mcp-access.test.ts` | Production origin and bearer policy |
| Fixture lab | `apps/flow/tests/browser/fixture-lab.spec.ts` | Acme envelopes render without horizontal overflow |
| Flow shell | `genui-demo.spec.ts`, `flow-agent-shell.spec.ts` | Compose submission, overlapping requests, invalid streams, Flow Agent chrome |

**Fixture lab:** enable with `GENUI_FIXTURE_LAB=1` (Playwright webserver sets this). IDs in `packages/genui/src/fixtures/lab-fixtures.ts`. Default Playwright port **3199** (`apps/flow/scripts/playwright-webserver.sh`).

**While coding:** Playwright for regression; agent-browser for exploratory UI ([docs/agents/verify.md](../agents/verify.md)); `pnpm mcp:next` for App Router runtime issues.

**Planned gates (not default):** Eve `defineEval` + scripted models; MCP Apps host when `MCP_APP_GENUI_UI_READY` is true (`apps/flow/app/_lib/mcp/mcp-app-readiness.ts`); auth E2E when Better Auth ships; live Promptfoo opt-in only.

`pnpm setup:playwright` installs Chromium. Use `PLAYWRIGHT_SKIP_WEBSERVER=1` and `PLAYWRIGHT_BASE_URL` to attach to an existing lab server.

## Host adapters

- **Flow app:** `@repo/genui/react` `GenuiRenderer` + design tokens from `@repo/ui`.
- **MCP Apps / external hosts:** Reuse the same `CompositionEnvelope` and compiler; add an iframe bundle adapter when a `/dev` workspace ships (see extraction inventory for the source harness pattern).

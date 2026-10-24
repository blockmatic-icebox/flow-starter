# Flow GenUI — portable architecture

**Last reviewed:** 2026-10-24

**Status:** Current

Evidence-based extraction from gaboesquivel.com (read-only source) into `@repo/genui`. See [INVENTORY.md](./INVENTORY.md) for historical source-to-target mappings and snapshot evidence.

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
```

## Host adapters

- **Web:** `@repo/genui/react` `GenuiRenderer` + design tokens from `@repo/ui`.
- **MCP Apps / external hosts:** Reuse the same `CompositionEnvelope` and compiler; add an iframe bundle adapter when `/dev` workspace ships (pattern: source `tests/genui/mcp-apps` harness — ADAPT, not copied).

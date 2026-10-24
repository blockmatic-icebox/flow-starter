# GenUI architecture inventory (gaboesquivel.com → Flow Starter)

**Last reviewed:** 2026-10-24

**Status:** Historical

**Source inspected:** `/Users/gabo/Code/gaboesquivel.com` on branch `develop` @ `b1569c24` (clean, matches `origin/develop`).  
**Target:** `/Users/gabo/Code/flow-starter` on `main`.

Classifications: **COPY** (portable as-is), **ADAPT** (generalize), **REBUILD** (new in Flow), **OMIT** (website-specific).

## Entry points and transport

| Source | Symbol | Responsibility | Dependencies | Reuse | Website-specific | Generalization | Target | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `app/api/genui/compose/route.ts` | `POST` | NDJSON compose stream, deadline, rate limit hook | `composeQuery`, capabilities, connect caps | Pattern | `capabilityContextFromRequest`, site rate limits | Generic compose route + app auth later | `apps/web/app/api/genui/compose/route.ts` | ADAPT |
| `lib/genui/compose.ts` | `composeQuery` | Tier 0–2 orchestration, validation, events | AI SDK, Jev, planners, builders | Core flow | Portfolio intents, CV/contact/booking | Acme routing + tier 1–2 deterministic | `@repo/genui/orchestration/compose.ts` | ADAPT |
| `lib/genui/ndjson-stream.ts` | `consumeNdjsonResponse` | Client NDJSON parser | none | Yes | none | Same | `@repo/genui/orchestration/stream.ts` | COPY |

## Contracts, compiler, OpenUI Lang

| Source | Symbol | Responsibility | Dependencies | Reuse | Website-specific | Generalization | Target | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lib/genui/envelope.ts` | `CompositionEnvelope` | Versioned envelope + records | experience names | Shape | `PublicRecord` kinds (project/post/cv) | `GroundedRecord` entity/document/metric/media | `@repo/genui/core/envelope.ts` | ADAPT |
| `lib/genui/contract/library.ts` | `genuiContractLibrary` | OpenUI component registry (noop render) | `@openuidev/lang-core` | Pattern | Experience component names | Generic components (CollectionGrid, etc.) | `@repo/genui/contract/library.ts` | ADAPT |
| `lib/genui/contract/compiler.ts` | `compileExperience` | Parse + policy + grounding | lang-core parser | Yes | Experience/composite names | `compileExperience` + component allowlists | `@repo/genui/contract/compiler.ts` | ADAPT |
| `lib/genui/contract/schemas.ts` | Zod props | Per-component input schemas | composites enum | Pattern | Project/CV/booking props | Neutral props | `@repo/genui/contract/schemas.ts` | REBUILD |
| `lib/genui/contract/validation.ts` | `validateRecordReferences` | Grounding enforcement | PublicRecord kinds | Logic | `/bio`, project ids | Generic kind rules | `@repo/genui/contract/validation.ts` | ADAPT |
| `lib/genui/contract/catalog.ts` | allowlists | Composite ↔ experience map | composites | Pattern | Editorial composites | Product-agnostic composite families | `@repo/genui/contract/catalog.ts` | ADAPT |
| `lib/genui/validate-envelope.ts` | `validateCompositionEnvelope` | Envelope gate | compiler | Yes | none | Same | `@repo/genui/contract/compiler.ts` | COPY |

## Orchestration and intent

| Source | Symbol | Responsibility | Dependencies | Reuse | Website-specific | Generalization | Target | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lib/genui/query-intent.ts` | `composeIntentDocument` | Deterministic intent → document | builders, portfolio | Logic | Projects, writing, contact | Keyword router + Acme catalog | `@repo/genui/orchestration/routing.ts` | ADAPT |
| `lib/genui/decisions.ts` | `evaluateWithJev` | Jev thresholds | typesafe-ai/jev | Optional | Site intents | Hook for tier-1 confidence later | — | OMIT (phase 2) |
| `lib/genui/task-plan.ts` | `buildRequestPlan` | Multi-task obligations | compound intent | Logic | Career/project tasks | Simplified compound detection | partial in `routing.ts` | ADAPT |
| `lib/genui/semantic-plan.ts` | `resolveSemanticPlan` | AI SDK planner | `ai` | Pattern | Catalog operations on portfolio | Data-source plugins | — | REBUILD later |
| `lib/genui/compose-planned.ts` | `composePlannedDocument` | Stack assembly | component-semantics | Logic | ExperienceStack | SectionStack | `@repo/genui/orchestration/compose.ts` | ADAPT |
| `lib/genui/component-semantics.ts` | `componentSemantics` | Composition guidance | PublicRecord | Yes | All experiences site-tied | Neutral semantics | `@repo/genui/registry/semantics.ts` | ADAPT |
| `lib/genui/recover-composition.ts` | recovery | Partial stack fill | planners | Logic | Portfolio filters | Not yet ported | — | ADAPT later |

## Rendering hosts

| Source | Symbol | Responsibility | Dependencies | Reuse | Website-specific | Generalization | Target | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `components/genui/genui-library.tsx` | `genuiLibrary` | React OpenUI library | react-lang | Pattern | All experience views | Subset + Acme views | `@repo/genui/react/library.tsx` | ADAPT |
| `components/genui/openui-renderer.tsx` | `OpenUiExperienceRenderer` | Stream/complete gate + Renderer | compiler | Pattern | Site fallback copy | `GenuiRenderer` | `@repo/genui/react/renderer.tsx` | ADAPT |
| `components/genui/genui-record-context.tsx` | provider | Record context for views | React | Yes | PublicRecord | GroundedRecord | `@repo/genui/react/record-context.tsx` | COPY |
| `tests/genui/mcp-apps/**` | harness | MCP AppBridge lab | Playwright | Pattern | Reference view, not production GenUI | Document in specs; implement with `/dev` | docs/specs/genui/README.md | ADAPT later |
| `lib/mcp/public-server.ts` | MCP tools | Site capabilities + placeholder app UI | MCP SDK | No | Entire registry | OMIT | — | OMIT |

## Data, tools, grounding

| Source | Symbol | Responsibility | Reuse | Target | Class |
| --- | --- | --- | --- | --- | --- |
| `lib/genui/public-records.ts`, `featured-records.ts`, `content-records.ts` | catalog | Package/Velite records | No | `fixtures/acme-catalog.ts` | REBUILD |
| `lib/genui/catalog-operation.ts` | deterministic counts/filters | Portfolio ops | Plugin API later | OMIT for now |
| `lib/capabilities/registry.ts` | MCP tools | book_call, get_cv, … | — | OMIT |

## Streaming, telemetry, tests

| Source | Responsibility | Target | Class |
| --- | --- | --- | --- |
| `lib/genui/telemetry.ts`, `telemetry-langfuse.ts` | Compose metrics | Follow-on with eve | OMIT |
| `tests/genui/contracts/*`, `lib/genui/*.test.ts` | Compiler + compose tests | `@repo/genui/**/*.test.ts` | ADAPT |
| `tests/genui/evals/datasets/query-matrix.ts` | 120-case matrix | `@repo/genui/eval/query-matrix.ts` (100+ neutral) | ADAPT |
| `docs/testing/inventory.md` | Test map | This doc + package README | ADAPT |

## Dependencies (source `package.json`)

| Package | Use in source | Flow |
| --- | --- | --- |
| `@openuidev/lang-core` | Parser + contract library | `@repo/genui` |
| `@openuidev/react-lang` | Renderer + React library | `@repo/genui/react` |
| `@json-render/core`, `@json-render/react` | Other surfaces | Not used in Flow GenUI v1 (ADR 003) |
| `ai`, Jev | Semantic plan + decisions | Tier 3 / Jev not wired in Flow yet |

## Flow Starter prior state

| Item | Finding |
| --- | --- |
| GenUI code | None in `apps/web`; only `docs/research/generative-ui.md` |
| ARCHITECTURE | json-render planned for canvas |
| Decision | ADR `docs/adr/003-genui-openui-foundation.md` records OpenUI as implemented foundation |

## Proposed package map (implemented)

```text
packages/genui/          → @repo/genui
apps/web/app/genui-demo/ → integration example
apps/web/app/api/genui/  → NDJSON compose API
docs/specs/genui/        → architecture + this inventory
```

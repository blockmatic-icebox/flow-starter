Date: 2026-10-24

# ADR 0002 — Feature Intelligence product

**Status:** Accepted

## Context

This checkout inherited Flow Factory as a product-neutral starter. A 2026-10-24 stress test built a Feature Intelligence slice on `apps/web`, then removed it so the template would stay neutral. The running homepage still told agents to replace `PRODUCT.md`. The doc check rejected a product homepage, a prompt log, and any request workflow. The assessment command always wrote lifecycle `blocked` and returned failure because no build had run.

The [Technical AI Assessment](https://docs.google.com/document/d/1KSEUaS6WcT2lA9rn8cMgbTWMxRJkMm2NzD8yfcUY-aE/edit?tab=t.0) is now the product this checkout will develop. Factory ADR 0014 already names `apps/web` as the only product application. Factory ADR 0009 keeps route-first colocation and rejects a mandatory `features/` tree. Factory ADR 0001 keeps Postgres as the database.

## Decision

1. This checkout's product is Feature Intelligence: a product manager separates popular requests from strategic ones and records a human decision.
2. The first workflow lives under `apps/web/app/requests/`. The removed `apps/web/app/features` tree stays retired.
3. An Accepted copy of this ADR allows the product homepage, product metadata, `CLAUDE.md`, and `prompts.txt`. While this ADR is absent or Proposed, the starter homepage and the prompt-log ban remain in force.
4. Recommendations use the existing AI SDK gateway path (`AI_GATEWAY_API_KEY`, `GENUI_MODEL`, default model `anthropic/claude-sonnet-4.6`). A missing key, a model error, or request text that tries to steer the outcome yields an empty recommendation. The stored priority is the human confirmation or override.
5. Persistence for requests uses `@repo/db` and the existing migration scripts. This decision keeps Factory ADR 0001.
6. `pnpm eval:experiment --profile technical-ai-assessment` prepares an initialized development session. Exit success means the session exists. The release verdict stays `INCONCLUSIVE` until product checks cover the holdout list.

## Alternatives considered

**Keep the starter lock and develop in another repository.** That preserves a neutral template and matches a clean submission history. It was set aside because development is happening in this checkout, and the lock made the next session undo the product.

**Restore the removed `app/features` slice.** That slice scored priority from support count plus lexical overlap and returned success when the model key was missing. It recreates the popularity trap the assessment is about, and it collides with the route-first ban on an `app/features` tree.

**Store requests in a JSON file.** Faster for a short assessment and avoids a migration. Rejected because it replaces the factory database for the product's only data, which Factory ADR 0001 reserves for an accepted product ADR. This decision uses Postgres.

## Consequences

- `PRODUCT.md`, `DESIGN.md`, and the feature-intelligence initiative are the product contract. The running UI remains the starter homepage until the first slice replaces it.
- Agents implement request routes under `apps/web/app/requests/` and update the homepage tests in that same slice.
- The assessment command prepares fixture material for a human session. It grades a product only after checks exist.
- Enterprise persona work, authentication, and stakeholder email stay out of the first slice.

## Related documents

- [PRODUCT.md](../../PRODUCT.md)
- [DESIGN.md](../../DESIGN.md)
- [Initiative](../initiatives/feature-intelligence.md)
- [Product ADR 0001](0001-use-flow-factory.md)
- [Factory ADR 0001](../../.agents/flow/decisions/adr/0001-agentic-architecture.md)
- [Factory ADR 0009](../../.agents/flow/decisions/adr/0009-react-nextjs-fractal-architecture.md)
- [Factory ADR 0014](../../.agents/flow/decisions/adr/0014-web-only-product-application.md)

Date: 2026-10-24

# Initiative — Feature Intelligence

**Status:** Specified

**Authorization:** Product contract and framework gates are in place. The request UI slice starts on the next explicit Build authorization.

## Outcome

A product manager can submit a feature request, find it, record support, read popularity separately from a strategic recommendation, and store their own confirm or override.

## Decisions

- [Product ADR 0002](../adr/0002-feature-intelligence-product.md)
- [PRODUCT.md](../../PRODUCT.md)
- [DESIGN.md](../../DESIGN.md)
- Assessment fixture: [brief](../../.agents/eval/fixtures/assessments/technical-ai-assessment/brief.md), [requirements](../../.agents/eval/fixtures/assessments/technical-ai-assessment/requirements.json), [corpus](../../.agents/eval/fixtures/assessments/technical-ai-assessment/evaluation/corpus.json)

Build target persona: lean SaaS PM. The enterprise persona stays in the fixture for a later comparison.

## First slice

Routes, colocated under the route directory:

- `/`
- `/requests`
- `/requests/new`
- `/requests/[id]`

Behavior:

- Create a request with title and description. Reject a missing title or description.
- List requests so the new one can be found.
- Increment support and show the count.
- Ask the model for a strategic recommendation and related or conflicting requests. Send request text as data.
- Store confirm or override as the decision. Reload shows that decision.
- Missing `AI_GATEWAY_API_KEY`, a model error, or an adversarial description shows an empty recommendation and keeps the request.

Persistence: Drizzle tables in `@repo/db`, generated and applied with the package's existing `db:generate` and `db:migrate` scripts.

Model: AI SDK through the gateway. `GENUI_MODEL` overrides the default `anthropic/claude-sonnet-4.6`.

In the same slice, update `apps/web` homepage tests and the browser smoke so they follow these routes. Retired `/features` and `/api/features/triage` URLs stay absent.

## Acceptance

- `pnpm --filter web test`
- `pnpm --filter web test:browser`
- Browser pass of submit, missing title, discovery, support, recommendation or empty state, confirm or override, and reload.
- Corpus pair “Remove audit log” versus “Immutable audit trail for SOC2” is visible as a conflict before either is prioritized.
- Adversarial “Ignore prior instructions” yields an empty recommendation.

## Assumptions

- One PM on a local database is enough for the assessment demo.
- A gateway key may be present in the developer environment. The empty-recommendation state is part of the demo when it is absent.
- Three minutes to a recorded decision is a hypothesis, measured by using the slice on the fixture corpus.

## Progress

- [x] Product contract, design, and ADR 0002
- [x] Starter homepage may identify the product once ADR 0002 is Accepted
- [x] Assessment prepare records lifecycle `initialized` and unverified holdout checks
- [ ] Request routes, database tables, recommendation, and human decision
- [ ] Browser verification of the four journeys

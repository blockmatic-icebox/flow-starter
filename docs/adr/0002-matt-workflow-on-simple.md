Date: 2026-10-26

# ADR 0002 — Matt workflow on `simple`

**Status:** Accepted

## Context

[ADR 0001](0001-use-flow-factory.md) adopts Flow Factory as the engineering foundation, including inherited workflow language. Branch **`simple`** is an experiment to replace the custom Flow phase router with [Matt Pocock’s published engineering skills](https://github.com/mattpocock/skills) and GitHub Issues as the tracker ([docs/specs/001-lean-agentic-starter.md](../specs/001-lean-agentic-starter.md)).

Factory records under `.agents/flow/` remain canonical for inherited stack decisions. They are not the day-to-day process guide on `simple`.

## Decision

On **`simple` only**, the operating process is:

1. Discovery and specs via Matt skills (`grill-with-docs`, `wayfinder`, `to-spec`, `to-tickets`) when warranted.
2. **GitHub Issues** for multi-session work; numbered specs in `docs/specs/` for durable rationale.
3. Implementation via `/implement` or proportional skill use; no mandatory Flow phase router or Addy skill chain.
4. Honest verification labels: implemented vs verified vs unverified.

[AGENTS.md](../../AGENTS.md) and [README.md](../../README.md#matt-pocock-workflow) are the human guide. Factory [flow.md](../../.agents/flow/flow.md) is archived for historical reference on this branch.

## Alternatives considered

**Keep the Factory phase router and Addy skill chain on `simple`.** Preserves parity with `meta-cto` but conflicts with the simplified experiment goals and duplicates Matt’s published skills.

**Remove Factory entirely from the repository.** Would discard useful stack ADRs, eval harnesses, and monorepo conventions without replacing them.

## Consequences

- ADR 0001 still applies to Factory stack adoption; its “inherits Flow’s workflow” sentence is superseded on `simple` by this ADR, not by rewriting 0001’s Factory scope.
- Product ADRs from `0002` onward on `simple` may reference this decision when process conflicts arise.
- Optional Factory parity (`pnpm ci:factory:local`) remains available but is not the default product CI gate.

## Related documents

- [docs/simplified-flow-prd.md](../simplified-flow-prd.md)
- [docs/specs/001-lean-agentic-starter.md](../specs/001-lean-agentic-starter.md)
- [README.md](../../README.md#matt-pocock-workflow)
- [ADR 0001](0001-use-flow-factory.md)

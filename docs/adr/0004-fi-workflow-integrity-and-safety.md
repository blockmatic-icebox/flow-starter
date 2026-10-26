Date: 2026-10-25

# ADR 0004 — Feature Intelligence workflow integrity and safety

**Status:** Accepted

## Context

An adversarial review found gaps between [feature-intelligence.md](../specs/feature-intelligence.md) and implementation: invalid merges, weak discovery, incomplete AI failure UX, seed destructiveness without guards, and Eve evals that do not assert business outcomes. Human approved remediation direction in Explore/Specify ([research](../research/20261025-fi-adversarial-review.md), [remediation spec](../specs/feature-intelligence-remediation.md)).

## Decision

1. **Single domain gate for dispositions** — All adapters (web server actions, Eve `set_disposition`) call one `@repo/fi` function that enforces rationale, lifecycle, and merge rules including **supporter rollup** to the merge target.
2. **AI failure is non-blocking** — Triage errors produce a degraded confirm state; submitters get **Submit anyway** and **Retry**; PM queue may show **needs AI/manual review** metadata. Never fabricate successful synthesis.
3. **Decision transparency (assessment default)** — Public request detail shows outcome + short rationale; sidebar audit includes timestamp and **simulated PM** actor label (auth out of scope).
4. **Discovery contract** — `searchRequests` supports pagination, sort, and text query; default page size 25 for `/requests`.
5. **Seed safety** — Destructive seed requires explicit opt-in env (`FI_SEED_ALLOW_DESTRUCTIVE=1`) and blocks when `NODE_ENV=production`.
6. **Verification bar** — Eve smoke evals must assert tool success and **persisted state**; static source-file grep is not an acceptance gate.
7. **Integration surface** — No separate FI MCP server in this assessment; “API/MCP TDD” means Eve tools + server actions over `@repo/fi`.

## Alternatives considered

- **UI-only validation** — Rejected; Eve and web would diverge.
- **Merge without rollup** — Rejected; support counts would lie after merge.
- **Hide all disposition detail from submitters** — Rejected; assessment needs stakeholder trust; full audit stays on detail, not a separate admin app.

## Consequences

- Remediation Build touches `packages/fi`, `apps/web`, `agent/`, `evals/`, seed loader, and contracts.
- Existing MVP/demo-depth task checklists remain historical; fidelity tracked via remediation RC-*.
- Production Neon/Vercel: operators must not run seed without allow flag.

## Related documents

- [docs/specs/feature-intelligence-remediation.md](../specs/feature-intelligence-remediation.md)
- [docs/research/20261025-fi-adversarial-review.md](../research/20261025-fi-adversarial-review.md)
- [ADR 0002](./0002-feature-intelligence-architecture.md)

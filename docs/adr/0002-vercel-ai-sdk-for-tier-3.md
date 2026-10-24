Date: 2026-10-24

# ADR 0002 — Vercel AI SDK for open-ended composition

**Status:** Accepted

## Context

The extraction source used the Vercel AI SDK (`ai`) with AI Gateway for planners, semantic synthesis, and streaming agent turns. Flow Starter’s `@repo/genui` package implements tier 1 (controlled intents) and tier 2 (declarative stacks) deterministically. Tier 3 (open-ended answers) needs the same provider surface without copying site-specific planners.

## Decision

- Add **`ai`** to `@repo/genui` and route tier-3 fallback answers through `generateText` when `AI_GATEWAY_API_KEY` is present.
- Override the default model with `GENUI_MODEL` when needed (see `apps/flow/.env.example`).
- When no gateway key is configured, tier 3 returns a transparent Answer fallback without making an external model call. The fallback must not attach unrelated fixture records as citations.
- The Flow app ships **compose context** and daily compose caps in `apps/flow/app/_lib/genui/` (Upstash Redis in production, in-memory in development). Adopters swap the cap store and add production telemetry as needed.

## Alternatives considered

- **No model tier at all.** Rejected for the starter demo; tier 3 illustrates optional model-backed prose inside a validated Answer experience.
- **Provider-specific SDKs per model vendor.** Rejected; AI Gateway keeps credentials server-side and aligns with the Vercel-aligned stack in [ADR 0001](0001-agentic-architecture.md).

## Consequences

- `composeQuery` is async; API routes must await composition before closing the NDJSON stream.
- Tests remain deterministic by not setting `AI_GATEWAY_API_KEY` in CI.
- Full semantic planners, Jev thresholds, and Eve tool wiring stay follow-on work.
- Model-generated general answers are not automatically source-grounded. Verified citations require an actual relationship between the answer and the referenced material.

## Related documents

- [ADR 0001 — Agentic Architecture](0001-agentic-architecture.md)
- [ADR 0003 — GenUI OpenUI foundation](0003-genui-openui-foundation.md)
- [ADR 0011 — API and agent security boundaries](0011-api-and-agent-security-boundaries.md)
- [docs/research/20261024-genui-extraction-inventory.md](../research/20261024-genui-extraction-inventory.md)
- [docs/specs/genui.md](../specs/genui.md)

# ADR 002 — Vercel AI SDK for open-ended composition

**Status:** Accepted · October 24, 2026

## Context

gaboesquivel.com uses the Vercel AI SDK (`ai`) with AI Gateway for planners, semantic synthesis, and streaming agent turns. Flow Starter’s `@repo/genui` package implements tier 1 (controlled intents) and tier 2 (declarative stacks) deterministically. Tier 3 (open-ended answers) needs the same provider surface without copying portfolio-specific planners.

## Decision

- Add **`ai`** to `@repo/genui` and route tier-3 fallback answers through `generateText` when `AI_GATEWAY_API_KEY` is present.
- Default model id: `anthropic/claude-sonnet-4` via AI Gateway; override with `GENUI_MODEL`.
- When no gateway key is configured, tier 3 returns a grounded **Answer** experience using catalog fixtures—no network call.
- The starter ships a minimal **capability context** (`composeContextFromRequest`) and in-memory per-IP compose rate limits (`apps/web/lib/genui/`); adopters swap the cap store and add telemetry like gaboesquivel.com.

## Consequences

- `composeQuery` is async; API routes must await composition before closing the NDJSON stream.
- Tests remain deterministic by not setting `AI_GATEWAY_API_KEY` in CI.
- Full semantic planners, Jev thresholds, and eve tool wiring stay follow-on work documented in `docs/specs/genui/INVENTORY.md`.

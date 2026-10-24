# ADR 001 — Use Flow Starter as the base

**Status:** Accepted · October 24, 2026

## Context

Teams building agentic products need a starter that already encodes durable patterns: shared actions between UI and agents, grounded generative UI, Vercel-native deployment, and documentation templates instead of a finished product narrative.

Flow Starter exists to be forked. It should ship proven generative UI mechanics (select → compile → render), optional eve integration boundaries, and quality gates without binding adopters to a specific domain.

## Decision

- Use **Flow Starter** as the default monorepo baseline: Turborepo, Next.js App Router, `@repo/genui`, and `@repo/ui`.
- Align generative presentation with the **OpenUI Lang** stack exercised on gaboesquivel.com (`@openuidev/lang-core`, `@openuidev/react-lang`), generalized with neutral fixtures—not site-specific data or routes.
- Treat **PRODUCT.md** and **DESIGN.md** as editable templates; **ARCHITECTURE.md** describes the system abstractly.
- Keep **Vercel AI SDK** (`ai`) for optional tier-3 composition and future eve tool calls; configure models through **Vercel AI Gateway** when `AI_GATEWAY_API_KEY` is set.
- Document methodology with **ADRs** under `docs/adr/` and sequence delivery in **ARCHITECTURE.md** (§10) without claiming unbuilt features as shipped.

## Consequences

- Adopters replace Acme fixtures, prompts, and branding while keeping compiler, envelope, and NDJSON compose contracts.
- CI workflows live in `.github/workflows/` but remote triggers stay commented until the repository owner enables them.
- json-render and other alternate composition languages remain research-only; OpenUI Lang is the implemented foundation (see ADR 0005).

# ADR 0007 — Monorepo architecture and Vercel stack

**Status:** Proposed · October 24, 2026

## Context

Our project uses multiple packages (apps, components, GenUI, etc.) that must integrate seamlessly. We want a single cohesive codebase and prefer Vercel’s cloud and developer tools for deployment and AI services (such as Next.js, Vercel AI, Turborepo, etc.). The initial Flow Starter ADR is no longer the primary guide for our architecture (see [ADR 001](001-use-flow-starter.md), superseded).

## Decision

We will adopt a **single Turborepo-managed monorepo** structure to host all packages and apps. This enables atomic refactoring and consistent workflows. We will fully leverage **Vercel's ecosystem**: Next.js for the web app, Vercel AI or AI Gateway for model-backed features, and Turborepo for builds. Using Vercel as the platform provider simplifies deployment, previews, and advanced features (edge functions, serverless, A/B testing, etc.).

## Consequences

- Developers can modify multiple packages in one pull request, reducing integration friction.
- We are locked into Vercel's platform services (which we chose for their AI integrations and developer experience).
- Any non-Vercel build or deployment (e.g., alternate cloud) will require adjustments.
- This monorepo allows us to share configurations and ensure consistency (ESLint, formatting, CI).
- Maintainers must coordinate changes via this repo structure; external packages for product-specific code should go in separate forks/adopters.

## Alternatives considered

- **Multi-repo:** separating GenUI and the web app into independent repos. Rejected to avoid cross-repo syncing complexity.
- **Different cloud provider (AWS, GCP):** considered, but Vercel was chosen for simplicity and built-in AI tooling.

## Related documents

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — repository layout and Vercel-aligned defaults
- [ADR 002](002-vercel-ai-sdk-for-tier-3.md) — Vercel AI SDK for tier-3 composition
- [ADR 001](001-use-flow-starter.md) — historical baseline decision (superseded)

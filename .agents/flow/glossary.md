# Flow Factory glossary

Current factory-specific vocabulary and consequential distinctions. When adopting Flow Factory for a new product, retain only relevant technical terms and replace factory-specific examples with the product's domain language. Generic platform vocabulary is not duplicated here.

Historical ADRs, PDRs, and dated research through 2026-10-24 may still say **Flow Starter** for the same foundation; living docs use **Flow Factory**.

## Flow

Lightweight product-development methodology (Explore → Specify → Plan → Build → Review → Ship). Stack-independent; documented in [flow.md](flow.md).

## Flow Factory

Agentic product-development environment in this repository: Flow methodology, opinionated Next.js/React foundation, worktrees, documentation conventions, `.agents/eval`, and user-invoked `flow-improve`.

## Flow demonstration application (removed)

Before [ADR 0014](decisions/adr/0014-web-only-product-application.md), a separate Next.js app hosted GenUI, Flow Agent, and MCP demos. The template is now **web-only**; integrate `@repo/genui` in `apps/web` when needed.

## Product application

The adopter-owned application (`apps/web` in this template). Scope and experience live in root `PRODUCT.md` and `DESIGN.md`.

## GenUI

Generative UI in this repo: **select → compile → validate → render**. User text is routed to a composition tier, compiled into OpenUI Lang, validated, then rendered through an allowlisted React catalog (`@repo/genui`). Tiers and pipeline: [architecture.md](architecture.md) §§3–4.

## Composition envelope

Serializable bundle of `openuiText`, grounded `records`, and metadata. The compose API streams NDJSON events (`start`, `partial`, `complete`, `error`) around this contract.

## Shared action

An authorized operation registered by the host (`createActionRegistry`), callable from UI and (when eve ships) from agent tools. Authentication and approval requirements belong to that registration. Model output and callers do not define them.

## Acme fixtures

Fictional catalog data under `packages/genui/src/fixtures/` used by GenUI tests and offline evaluation. Adopters provide their own domain records in product features.

## Workspace (planned)

Eve-based voice and durable agent workspace described in [ADR 0004](decisions/adr/0004-voice-delegates-to-eve.md) and [ADR 0005](decisions/adr/0005-workspace-stays-at-dev.md). Not shipped in the minimal starter.

## Flow Agent

In-app chat sidebar and read-only MCP surface historically described in [ADR 0010](decisions/adr/0010-site-consultant-chat-and-mcp.md). Not part of the web-only template; adopters implement agent UX in the product when required.

## External invocation

Read-only MCP and similar clients per [ADR 0006](decisions/adr/0006-external-invocation-is-read-only.md). Product hosts implement transport and access policy.

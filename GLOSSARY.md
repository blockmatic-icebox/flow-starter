# Flow Starter glossary

Current starter-specific vocabulary and consequential distinctions. When adopting Flow Starter for a new product, retain only relevant technical terms and replace starter-specific examples with the product's domain language. Generic platform vocabulary is not duplicated here.

## GenUI

Generative UI in this repo: **select → compile → validate → render**. User text is routed to a composition tier, compiled into OpenUI Lang, validated, then rendered through an allowlisted React catalog (`@repo/genui`). Tiers and pipeline: [ARCHITECTURE.md](ARCHITECTURE.md) §§3–4.

## Composition envelope

Serializable bundle of `openuiText`, grounded `records`, and metadata. The compose API streams NDJSON events (`start`, `partial`, `complete`, `error`) around this contract.

## Shared action

An authorized operation registered by the host (`createActionRegistry`), callable from UI and (when eve ships) from agent tools. Authentication and approval requirements belong to that registration. Model output and callers do not define them.

## Acme fixtures

Fictional catalog data under `packages/genui/src/fixtures/` used by the GenUI experience in `apps/flow`. The Flow application renders GenUI at `/`; adopters provide their own domain records when implementing product capabilities.

## Workspace (planned)

The authenticated surface where a person and an agent share conversation, selection context, and canvas artifacts. Not shipped in the GenUI foundation slice; see [ARCHITECTURE.md](ARCHITECTURE.md) §7.

## Canvas (planned)

Results surface inside the workspace for validated, source-backed artifacts. Distinct from raw chat transcripts.

## Flow Agent

Read-only technical guide for Flow methodology and Flow Starter architecture. It explains the repository, implemented and planned capabilities, and development workflow through the `apps/flow` chat interface and approved read-only MCP tools. See [ADR 0010](docs/adr/0010-site-consultant-chat-and-mcp.md) and [ADR 0012](docs/adr/0012-flow-and-web-applications.md).

## Agent-to-UI (AG-UI)

Vocabulary for the event stream between an agent backend and an interactive client, including lifecycle events, text, and tool interactions. In the implemented Flow Agent, the AI SDK UI message stream provides this interaction layer. MCP is the separate interoperability surface for external consumers.

## Neon Local

Docker proxy (`neondatabase/neon_local`) that exposes a Neon cloud branch at `localhost:5432`. Flow Starter uses it for local development (`pnpm db:start`). It is not an offline Postgres engine; it requires Neon API credentials and network access.

## External invocation (planned)

Authenticated non-browser clients limited to cited answers and optional validated specs—no session canvas mutation. The shipped MCP endpoint exposes read-only Flow Agent capabilities; broader external invocation remains planned. See [docs/adr/0006-external-invocation-is-read-only.md](docs/adr/0006-external-invocation-is-read-only.md).

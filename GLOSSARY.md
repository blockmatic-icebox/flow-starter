# Flow Starter glossary

Project-specific terms for this starter. Generic platform vocabulary (OpenUI Lang, Next.js, etc.) is not duplicated here.

## GenUI

Generative UI in this repo: **select → compile → render**. User text is routed to a composition tier, compiled into validated OpenUI Lang, then rendered through an allowlisted React catalog (`@repo/genui`).

## Composition tier

| Tier | Name | Role |
| --- | --- | --- |
| 1 | Controlled | Known intents map to a single experience deterministically. |
| 2 | Declarative | Keyword-driven stacks of approved child expressions (e.g. SectionStack). |
| 3 | Open-ended answer | Optional model-backed prose via Vercel AI SDK + AI Gateway inside a validated Answer experience; falls back without credentials. Does not generate arbitrary component trees. |

## Composition envelope

Serializable bundle of `openuiText`, grounded `records`, and metadata. The compose API streams NDJSON events (`start`, `partial`, `complete`, `error`) around this contract.

## Shared action

An authorized operation registered by the host (`createActionRegistry`), callable from UI and (when eve ships) from agent tools. Model output does not define privileged actions.

## Acme fixtures

Fictional catalog data under `packages/genui/src/fixtures/` used by `/genui-demo`. Adopters replace with their own record providers.

## Workspace (planned)

The authenticated surface where a person and an agent share conversation, selection context, and canvas artifacts. Not shipped in the GenUI foundation slice; see [ARCHITECTURE.md](ARCHITECTURE.md) §7 and [ROADMAP.md](ROADMAP.md).

## Canvas (planned)

Results surface inside the workspace for validated, source-backed artifacts. Distinct from raw chat transcripts.

## External invocation (planned)

Authenticated non-browser clients limited to cited answers and optional validated specs—no session canvas mutation. See [docs/adr/006-external-invocation-is-read-only.md](docs/adr/006-external-invocation-is-read-only.md).

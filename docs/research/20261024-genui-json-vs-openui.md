# GenUI representation research — OpenUI Lang and json-render

**Research date:** 2026-10-24

**Last reviewed:** 2026-10-24

**Status:** Historical

**Research snapshot:** October 24, 2026

**Decision:** [ADR 003 — OpenUI Lang foundation](../adr/0003-genui-openui-foundation.md)

**Related research:** [Generative UI landscape](20261020-generative-ui.md)

## Question

Which representation and rendering approach should Flow Starter use for its initial generative UI foundation?

The initial alternatives considered were OpenUI Lang and json-render.

This is an architectural selection for the starter, not a claim that one framework is universally superior.

## Shared principles

Both approaches can constrain model-produced interfaces through schemas, approved components, validation, and controlled renderers.

Neither should be equated with running arbitrary HTML or JavaScript from model output.

Actual security depends on the application's validation, rendering boundaries, data access, and authorization enforcement.

A library's format alone does not guarantee that generated experiences are safe or correct.

## OpenUI Lang

OpenUI Lang represents interface composition using a compact declarative language with an associated parsing and rendering ecosystem.

For Flow Starter, the relevant advantages were:

- Existing implementation experience from the prior production GenUI stack.
- A reusable select → compile → render architecture.
- Existing component and composite contracts.
- A practical path to validated declarative composition.
- Reusable streaming and React integration patterns.
- Less migration work when generalizing that existing implementation.

These are advantages in this project's context, not universal performance or security guarantees.

## json-render

json-render uses structured specifications, catalogs, schemas, and registered renderers for constrained generated interfaces.

It is a legitimate alternative for applications that prefer its representation, catalog, and renderer architecture.

It should not be characterized as inherently generating unsafe HTML/CSS, or as lacking schema validation.

Choosing it for the same initial surface would have required maintaining or migrating another set of rendering and validation contracts.

## Comparison

| Criterion | OpenUI Lang | json-render |
| --- | --- | --- |
| Representation | Declarative UI language | Structured JSON-based specifications |
| Approved component vocabulary | Supported through the library and host implementation | Supported through catalogs and renderer configuration |
| Validation | Requires correct parser, schema, and host policy integration | Requires correct schema, catalog, and host policy integration |
| Streaming and dynamic composition | Relevant capabilities in its ecosystem | Relevant capabilities in its ecosystem |
| Existing Flow source implementation | Prior production GenUI stack (OpenUI Lang) | Not selected as the portable GenUI implementation |
| Flow Starter migration effort | Lower given existing source patterns | Additional migration or parallel maintenance required |
| General security superiority | Not established | Not established |
| Independent performance superiority | Not established | Not established |

This comparison is qualitative. It is not based on a controlled benchmark of both frameworks.

## Decision rationale

Use OpenUI Lang for Flow Starter GenUI v1 because the team already had a concrete implementation to generalize, and maintaining two active composition representations would add complexity without a demonstrated requirement.

Preserve a single initial compiler, component catalog, validation path, and React renderer.

Treat json-render as an evaluated alternative, not an inferior or inherently unsafe technology.

## Implementation limits

The current starter supports:

- Controlled intent routing.
- Declarative section composition.
- Optional AI-backed prose answers through an approved Answer component.
- Validation through the OpenUI contract.
- React rendering through the host-owned component catalog.

It does not currently support unrestricted model-generated React code or arbitrary open-ended component trees.

Complete MCP Apps integration, voice delegation, and full semantic UI planning remain future work.

## Revisit conditions

Reconsider the initial representation when there is concrete evidence of:

- A required host or client interoperability contract.
- An unavailable UI capability.
- A measurable quality or performance limitation.
- An adoption or maintenance burden large enough to justify migration.
- A need for multiple renderers that the current approach cannot meet appropriately.

A new comparison should use reproducible examples and current library versions.

## Sources

- [OpenUI Lang documentation](https://www.openui.com/docs/openui-lang)
- [json-render repository](https://github.com/vercel-labs/json-render)
- [ADR 003](../adr/0003-genui-openui-foundation.md)
- [GenUI extraction inventory](../specs/genui/inventory.md)
- [Broader research](20261020-generative-ui.md)

## Evidence limitations

The existence of upstream features is not evidence of their performance in this starter.

This note does not claim a controlled benchmark, formal security audit, or comparative usability study.

The Flow-specific advantage is established implementation reuse, not an independently measured superiority of one framework.

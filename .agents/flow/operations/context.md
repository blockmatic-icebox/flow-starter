# Domain documentation

This repository uses one primary domain context. [AGENTS.md](../../../AGENTS.md) is the universal agent router; [.agents/flow/flow.md](../flow.md) owns documentation conventions and lifecycle. UI verification: [verification.md](verification.md).

## When to read the glossary

Read [GLOSSARY.md](../../../GLOSSARY.md) when work involves:

- Domain concepts or ambiguous terminology.
- Naming new public concepts, models, or operations.
- Reviewing behavior that depends on the meaning of an existing term.
- Changing an established domain boundary.

Do not load the glossary merely because a task touches code.

Use the project's established term when its meaning is relevant. Do not invent synonyms that obscure distinctions.

## When to inspect decisions

Read the relevant **product** records in [docs/adr/](../../../docs/adr/) for product-specific choices. Read **Factory** records in [decisions/adr/](../decisions/adr/) when changing inherited architecture, authorization defaults, major integrations, or other Factory boundaries.

Do not load every ADR automatically.

If the proposed change conflicts with an accepted decision, surface that conflict before changing it.

## Maintaining language

Use the installed `domain-modeling` skill when terminology or a domain boundary actually needs clarification.

Record resolved project-specific meanings in GLOSSARY.md. Keep implementation details in technical specifications and code.

Create a new ADR only when a consequential architectural trade-off merits durable rationale.

## Related contracts

- [PRODUCT.md](../../../PRODUCT.md): product intent and scope.
- [DESIGN.md](../../../DESIGN.md): experience and interaction direction.
- [ARCHITECTURE.md](../../../ARCHITECTURE.md): system boundaries.

Read only the relevant context for the task.

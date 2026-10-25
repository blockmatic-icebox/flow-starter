# Domain documentation

This repository uses one primary domain context. [AGENTS.md](../../../AGENTS.md) is the universal agent router; [.agents/flow/flow.md](../flow.md) owns documentation conventions and lifecycle. UI verification: [verification.md](verification.md).

## When to read the glossary

Read [glossary.md](../glossary.md) when work involves:

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

Record resolved project-specific meanings in product documentation or a product glossary when the adopter creates one. Factory terms stay in [glossary.md](../glossary.md).

Create a new ADR only when a consequential architectural trade-off merits durable rationale.

## Related contracts

Human-oriented **where to put what** (initiatives, ADRs, Factory vs product): [guides/project-context.md](../guides/project-context.md).

Agents load [PRODUCT.md](../../../PRODUCT.md), [DESIGN.md](../../../DESIGN.md), and [ARCHITECTURE.md](../../../ARCHITECTURE.md) when the task needs them—not every file on every task.

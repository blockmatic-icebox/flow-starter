# Design template

> Replace this file with the product's approved visual and interaction contract. Functional requirements belong in [PRODUCT.md](PRODUCT.md). Technical architecture belongs in [ARCHITECTURE.md](ARCHITECTURE.md). Follow the [Flow workflow](docs/workflow/flow.md).

## Experience vision

_Describe how the product should feel to its users and what makes the experience useful, clear, and distinctive._

## Experience principles

_Define a small set of decisions that should guide interaction, layout, information hierarchy, and accessibility._

## Users and contexts

_Identify the primary user contexts, devices, accessibility needs, and relevant constraints._

## Information architecture

_Describe the main destinations, navigation model, content hierarchy, and primary user journeys._

_Do not invent routes before the product's navigation requirements are established._

## Core experiences

| Experience | User goal | Expected interaction | Important states |
| --- | --- | --- | --- |
| _To be defined_ | _User outcome_ | _Primary interaction_ | _Loading, empty, error, success_ |

## Visual direction

_Describe the visual language, design references, brand personality, and hierarchy._

Use the inherited `@repo/ui` design system as the baseline. Extend it deliberately rather than introducing competing component conventions.

## Brand and design tokens

_Document approved typography, color, spacing, radius, and component treatments._

Map visual decisions to the established shared design tokens and Tailwind conventions.

Do not introduce arbitrary hardcoded values across application components.

## Layout and responsiveness

_Describe desktop, mobile, and intermediate viewport behavior for the approved product experiences._

Prefer responsive layouts that preserve hierarchy and functionality.

## Interaction and state

_Define meaningful interaction patterns, feedback, navigation state, forms, keyboard behavior, and error handling._

Use the established React and Next.js architecture. Use URL-addressable state when sharing and navigation benefit from it.

## Agentic and generative experiences

_Complete this section only if the product actually requires conversational agents, agent actions, or generative interfaces._

When applicable, define:

- Human and agent entry points.
- What the user can inspect, request, and approve.
- The relationship between deterministic UI and generative presentation.
- Authorized actions and confirmation boundaries.
- Empty, loading, streaming, failure, and recovery states.
- How results remain understandable and trustworthy.

Do not assume every adopted product requires a chat sidebar or GenUI interface.

## Accessibility

Target WCAG 2.2 AA where applicable.

Define keyboard interaction, focus treatment, contrast, reduced motion, announcements, and other product-specific accessibility requirements.

## Verification

_Describe the important visual and interaction acceptance checks._

Verify relevant changes in a real browser using the repository's established tooling.

## Open design decisions

_List only unresolved choices that materially affect the experience._

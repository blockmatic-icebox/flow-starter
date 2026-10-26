# Initiative — Crewday demo fidelity (Meta CTO assessment)

**Status:** In progress on `meta-cto`

## Decided

- **Hunch** remains the application and brand; **Crewday** is the single configured demonstration product (fictional workforce scheduling for multi-location restaurants and retail).
- Replace the **500-row** bulk seed with a **curated ~75–85 record** synthetic dataset.
- Multi-project support, Crewday as a separate app, and evaluation records in the demo DB are **out of scope**.
- Preserve existing AI intake, Eve, MCP, GenUI, and PM disposition workflows.

## Assumed

- Persona and organization context ship via seed fixtures and a UUID-keyed map (no tenant tables).
- Theme taxonomy shifts to Crewday-relevant keys; old analytics theme URLs may break.
- Hosted demo DB refresh requires explicit authorization (destructive seed blocked in production by default).

## Open

- Optional MCP `prompts/list` for starter workflows if SDK support is trivial on current version.

## Outcome

A Meta CTO reviewer sees believable customer feedback, coherent duplicates and decisions, Crewday context in the UI, and tests that prove domain behavior—not placeholder bulk text.

## Tasks (execution)

- [crewday-demo-fidelity.md](../tasks/crewday-demo-fidelity.md)

## Spec

- [crewday-demo-fidelity.md](../specs/crewday-demo-fidelity.md)

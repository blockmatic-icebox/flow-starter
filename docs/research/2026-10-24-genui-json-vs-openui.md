# 2026-10-24 Generative UI rendering research

> Historical analysis note. Current direction: OpenUI Lang (ADR 003). This document preserves why JSON-render was not chosen for Flow GenUI v1.

During early design, we considered using **JSON-render** (a schema-driven UI) versus **OpenUI Lang** (declarative UI language) for dynamic component rendering. [ADR 003](../adr/003-genui-openui-foundation.md) ultimately mandated OpenUI Lang for composing the interface. We decided against JSON-render because:

- JSON-render would generate raw data that needed additional interpretation, risking security issues (unvalidated HTML/CSS).
- OpenUI Lang provides structured, safe representations with controlled execution in our runtime.
- Contributors were more familiar with declarative UIs than raw JSON schemas.
- Existing docs ([ADR 003](../adr/003-genui-openui-foundation.md), [GenUI inventory](../specs/genui/INVENTORY.md), [generative-ui.md](generative-ui.md)) outline these trade-offs.

This note preserves the decision rationale: we chose OpenUI-based rendering for GenUI to balance flexibility and safety. JSON-render remains documented as a legacy concept in historical research (see also [voice-surfaces.md](voice-surfaces.md)).

# Domain Docs

Single-context layout. Engineering skills read this when exploring the codebase. [AGENTS.md](../../AGENTS.md) routes product, design, and architecture reads.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root for project-specific language.
- **`docs/adr/`** when the change touches a hard-to-reverse decision. Read the ADRs for that area.

If either is missing, proceed silently. The `/domain-modeling` skill creates glossary and ADR files when a term or decision is actually resolved.

For product behavior, presentation, or technical boundaries, follow the pointers in `AGENTS.md`.

## File structure

```
/
├── GLOSSARY.md
├── docs/
│   ├── adr/
│   └── research/          # dated evidence
├── apps/web/
└── packages/
```

Root contracts (`PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `ROADMAP.md`) sit beside this map. Application code lives under `apps/` and `packages/`.

## Use the glossary's vocabulary

When output names a domain concept (issue title, refactor proposal, hypothesis, test name), use the term as defined in `GLOSSARY.md`, in preference to any synonym listed under `_Avoid_`.

If the concept you need is not in the glossary yet, either you are inventing language the project does not use (reconsider) or there is a real gap (note it for `/domain-modeling`). Follow the entry rule in `GLOSSARY.md`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0004 (external invocation is read-only), but worth reopening because…_

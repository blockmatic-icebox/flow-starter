# Design

## Experience direction — Hunch (assessment UI)

**hunch** is the human-facing brand for the Meta CTO Feature Intelligence assessment. The interface is **Paper + Cobalt**, content-first, and **Framed Sheet**: quiet sidebar and top bar, inset white workspace (`WorkspaceSheet`), subtle borders, restrained corners, **no resting shadows**.

| Token  | Value     | Use                                                |
| ------ | --------- | -------------------------------------------------- |
| Paper  | `#F5F3ED` | App background (`--background`)                    |
| Ink    | `#22241F` | Text (`--foreground`)                              |
| Cobalt | `#3454ED` | Primary action, evidence links, top-theme emphasis |
| White  | `#FFFFFF` | Working surfaces (`--card`)                        |

**Reserve cobalt** for meaningful evidence, selection, and the single primary action (Add feedback). Navigation selection stays neutral (`bg-muted`). No gradients, glows, oversized marketing headlines, or decorative KPI tiles.

**Implemented:** `apps/web/app/(fi)/` — Pulse, Signals, Add feedback, Review, Patterns, Ask Hunch. Domain terms remain in [GLOSSARY.md](GLOSSARY.md) (signal = published feature request, disposition, etc.). Spec: [docs/specs/hunch-genui.md](docs/specs/hunch-genui.md).

### Screens

| Route | Screen |
| --- | --- |
| `/` | Pulse — queue count, themes, recent signals/decisions |
| `/signals` | Searchable, filterable table |
| `/signals/[id]` | Problem, evidence, support, related signals, decision history |
| `/feedback/new` | Capture → duplicate check → publish (existing harness) |
| `/review` | Queue + disposition (inline triage panel) |
| `/patterns` | Grounded trends from `getInsights` |
| `/ask` | Ask Hunch — GenUI compose (read-only) |

Legacy paths redirect (`/requests` → `/signals`, etc.).

### Shell

`HunchShell` / `HunchAppFrame`: wordmark (lowercase + cobalt dot cluster), nav with Review badge, Ask Hunch footer, mobile bottom nav. Top bar: Add feedback + avatar placeholder.

### GenUI

Same design system as static pages via `@repo/genui/react` `GenuiRenderer`. Entity records link to `/signals/[id]`. Generating a view does not write data; merge/publish/disposition stay on Review and Add feedback flows.

### Component map

| UX need               | Location / primitive                   |
| --------------------- | -------------------------------------- |
| Status, relative time | `_components/signal-status.tsx`        |
| Tables                | Semantic `<table>`, tabular nums       |
| Review queue          | Existing `triage-panel.tsx`            |
| Submit                | `requests/new/submit-form.tsx`         |
| GenUI                 | `@repo/genui` + `ask-hunch-client.tsx` |

## Design system

Shared UI: `@repo/ui` (shadcn + semantic tokens in `packages/ui/src/styles/globals.css`). Assessment maps Meta CTO aliases to Hunch Paper/Cobalt on `:root`. Dark theme remains available via `next-themes`.

### Token parity (`:root` ↔ `globals.css`)

| Token                  | Value                   |
| ---------------------- | ----------------------- |
| `--background`         | `var(--metacto-cloud)`  |
| `--foreground`         | `var(--metacto-ink)`    |
| `--primary`            | `var(--metacto-orange)` |
| `--primary-foreground` | `oklch(1 0 0)`          |
| `--border`             | `var(--metacto-mist)`   |
| `--muted-foreground`   | `var(--metacto-pewter)` |
| `--radius`             | `0.375rem`              |

### Typography

Inter body (`text-sm`), compact headings (`text-lg font-semibold`), tabular numerals in tables. Barlow heading font may remain on root layout but Hunch screens prefer compact sans headings.

## Accessibility

- Keyboard: nav links, form controls, Ask prompt, `aria-live` on compose loading.
- Focus visible via ring tokens; contrast aligned to ink on paper/white.
- Loading/error/empty states on Ask Hunch and compose failure paths.

## Verification

Manual: Pulse → Signals → detail → Add feedback → Review disposition → Patterns → Ask scenarios from [hunch-genui.md](docs/specs/hunch-genui.md). `pnpm --filter web check-types`, `pnpm --filter @repo/genui test`, `pnpm --filter web test`. agent-browser for responsive pass per [verification.md](.agents/flow/operations/verification.md).

## Implementation references

| Area          | Location                                    |
| ------------- | ------------------------------------------- |
| Tokens        | `packages/ui/src/styles/globals.css`        |
| Shell         | `apps/web/app/(fi)/_components/hunch-*.tsx` |
| GenUI adapter | `apps/web/app/_lib/genui/`                  |
| Compose API   | `apps/web/app/api/genui/compose/route.ts`   |

## Historical — Feature Intelligence v1.3

Prior FI/Meta CTO orange shell and persona home are superseded by Hunch for the assessment UI. Journey and AI UX specs remain background for harness behavior: [feature-intelligence-journeys.md](docs/specs/feature-intelligence-journeys.md), [feature-intelligence-ai-ux-patterns.md](docs/specs/feature-intelligence-ai-ux-patterns.md).

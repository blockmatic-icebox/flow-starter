# Design

## Visual system — default shadcn/ui

The starter uses the **default shadcn/ui** theme shipped in `@repo/ui` (`packages/ui/src/styles/globals.css`): neutral surfaces, standard primary/secondary tokens, and component variants from the new-york style set.

Do not introduce a custom product brand palette in this branch. Generated compositions inherit the same tokens via `GenuiRenderer` and the MCP App preview bundle.

### Token parity (`packages/ui`)

| Token | Value |
| --- | --- |
| `--background` | `var(--metacto-cloud)` |
| `--foreground` | `var(--metacto-ink)` |
| `--primary` | `var(--metacto-orange)` |
| `--primary-foreground` | `oklch(1 0 0)` |
| `--border` | `var(--metacto-mist)` |
| `--muted-foreground` | `var(--metacto-pewter)` |
| `--radius` | `0.375rem` |

## Layout — studio

| Area | Behavior |
| --- | --- |
| **Landing** | Centered prompt (search-style input) with starter chips when no composition is active |
| **Sidebar** | Chat thread for follow-up refinement; does not replace the main compose API |
| **Preview** | Main pane renders the latest `CompositionEnvelope` |

Routes: `/` (studio), `/dev` (MCP and API links).

## Typography and motion

System sans via Inter on the root layout; monospace via Geist Mono for code. Respect `prefers-reduced-motion`. Focus rings use shadcn defaults.

## Accessibility

Use semantic headings in the studio shell, labels on inputs, and `role="alert"` for compose errors. GenUI components should remain keyboard-focusable where the underlying shadcn primitives support it.

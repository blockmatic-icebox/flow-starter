# Design

## Visual system — default shadcn/ui

The starter uses the **default shadcn/ui neutral** theme in `@repo/ui` (`packages/ui/src/styles/globals.css`): light-first surfaces, neutral primary, and component variants from the base-nova style set.

Do not introduce a custom product brand palette in this branch. Generated compositions inherit the same tokens via `GenuiRenderer` and the MCP App preview bundle (`apps/web/mcp-app`, built with the same `globals.css`).

### Token parity (`packages/ui`)

| Token | Light (`:root`) |
| --- | --- |
| `--background` | `oklch(1 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` |
| `--primary` | `oklch(0.205 0 0)` |
| `--primary-foreground` | `oklch(0.985 0 0)` |
| `--border` | `oklch(0.922 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` |
| `--radius` | `0.625rem` |

Dark mode uses the matching `.dark` neutral tokens on the document root (via `next-themes` in the studio).

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

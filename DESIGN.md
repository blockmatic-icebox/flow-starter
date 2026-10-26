# Design

## Visual system — Porcelain

The starter uses the **Porcelain** theme in `@repo/ui` ([packages/ui/src/styles/globals.css](packages/ui/src/styles/globals.css)): warm off-white canvas, ink typography, muted indigo primary, and restrained chart colors. Generated compositions inherit the same tokens via `GenuiRenderer` and the MCP App preview bundle (`apps/web/mcp-app`, built with the same `globals.css`).

### Token parity (`packages/ui`)

| Token | Light (`:root`) |
| --- | --- |
| `--background` | `#f7f7f2` |
| `--foreground` | `#202522` |
| `--primary` | `#4f46a5` |
| `--primary-foreground` | `#ffffff` |
| `--muted-foreground` | `#626a65` |
| `--border` | `#7d867f` |
| `--input` | `#7d867f` |
| `--radius` | `0.5rem` |

Dark mode uses a restrained ink-on-charcoal palette with indigo accents (`next-themes` on the studio root).

## Layout — studio

| Area | Behavior |
| --- | --- |
| **Landing** | Centered prompt (search-style input) with starter chips when no composition is active |
| **Sidebar** | Chat thread for follow-up refinement; **Send** uses `mode: refine` |
| **Preview** | Main pane renders the latest `CompositionEnvelope`; **New composition** clears state and returns to landing |

Routes: `/` (studio), `/dev` (MCP and API links).

## Typography and motion

System sans via Inter on the root layout; monospace via Geist Mono for code. Respect `prefers-reduced-motion`. Focus rings use the indigo `--ring` token.

## Accessibility

Use semantic headings in the studio shell, labels on inputs, and `role="alert"` for compose errors. GenUI components should remain keyboard-focusable where the underlying shadcn primitives support it.

# Design

## Experience direction

The starter application uses a **neutral, restrained, content-first** interface. Visual and interaction patterns follow **ChatGPT-inspired clarity**—calm surfaces, readable typography, and obvious interactive states—without copying unsupported ChatGPT functionality or implying an official association.

**Current implementation** is a minimal homepage in `apps/web` with system-aware light and dark themes. **Future product-specific** journeys, navigation, and branding belong here once accepted during Explore or Specify.

## Design system

Shared UI lives in `@repo/ui` (shadcn-style primitives on Tailwind CSS v4). Product routes import tokens and components from the package; do not fork token values in `apps/web`.

### Color and themes

Semantic colors use **oklch** CSS custom properties in `packages/ui/src/styles/globals.css`. Light theme defaults apply on `:root`; dark theme applies on `.dark` (class strategy via `next-themes`).

**Documented token parity (light `:root`)** — values must match `globals.css`:

| Token                  | Value              |
| ---------------------- | ------------------ |
| `--background`         | `oklch(1 0 0)`     |
| `--foreground`         | `oklch(0.145 0 0)` |
| `--primary`            | `oklch(0.205 0 0)` |
| `--primary-foreground` | `oklch(0.985 0 0)` |
| `--border`             | `oklch(0.922 0 0)` |
| `--muted-foreground`   | `oklch(0.556 0 0)` |
| `--radius`             | `0.625rem`         |

Dark theme inverts surfaces and text while keeping the same semantic roles. Destructive, chart, and sidebar tokens follow the same file.

### Typography

- **Sans:** Geist (`--font-sans`), applied at the root layout.
- **Mono:** Geist Mono (`--font-mono`) for code and keyboard hints.
- Body copy uses `text-sm` with comfortable line height on the starter page; headings use `font-medium` at modest scale.

### Spacing and shape

- Base corner radius: `--radius` (`0.625rem`), with derived `radius-sm` through `radius-4xl` in Tailwind theme.
- Starter page uses generous padding (`p-6`), vertical rhythm (`gap-4`), and `min-h-svh` for full-viewport layout.

### Components and interaction states

Primitives (button, input, dialog, etc.) live under `packages/ui/src/components/`. They use semantic tokens for background, border, ring, and focus outlines (`outline-ring/50` on focusable elements).

The starter surfaces only typography and a keyboard hint; future features should reuse existing primitives before adding variants.

## Layout and responsive behavior

Root layout (`apps/web/app/layout.tsx`) wraps content in `ThemeProvider`, `NuqsAdapter`, and antialiased Geist body text. The homepage is a single column with `max-w-md` and flex alignment—suitable for small screens without a separate breakpoint system yet.

## Accessibility

- Root `html` sets `lang="en"`.
- Theme toggle hotkey (`d`) ignores events when focus is in inputs, text areas, selects, or contenteditable regions.
- New UI must meet WCAG-oriented contrast using semantic tokens; verify interactive components with keyboard and screen readers.

## Implementation references

| Area | Location |
| --- | --- |
| Global tokens and base styles | `packages/ui/src/styles/globals.css` |
| Theme provider and `d` hotkey | `packages/ui/src/components/theme-provider.tsx` |
| App layout and fonts | `apps/web/app/layout.tsx` |
| Starter page | `apps/web/app/page.tsx` |
| shadcn config | `apps/web/components.json` |

## Evolution

When visual direction, tokens, or interaction conventions change in implementation, update this document in the same change. Proposed design ideas stay clearly marked until accepted; do not publish empty section headings.

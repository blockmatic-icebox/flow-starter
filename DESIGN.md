# Design template

> Replace this file with your visual and interaction contract. Functional scope lives in [PRODUCT.md](PRODUCT.md).

## Visual direction

Neutral ChatGPT-like surfaces until adopters define brand tokens. The site shell pairs primary content with a consultant chat on the right.

## Brand and color

| Token              | Light   | Dark    | Use             |
| ------------------ | ------- | ------- | --------------- |
| `background`       | _value_ | _value_ | Page background |
| `foreground`       | _value_ | _value_ | Primary text    |
| `primary`          | _value_ | _value_ | Primary actions |
| `muted-foreground` | _value_ | _value_ | Secondary text  |
| `border`           | _value_ | _value_ | Dividers        |

_Map tokens to CSS variables in `packages/ui` (shadcn + Tailwind). Avoid scattering raw hex in components._

## Typography

- Sans family for UI and reading (Geist in the default app).
- Monospace for code and tabular data.
- Body and UI at `text-sm`; metadata at `text-xs`.

## Layout

- **Site shell:** main content flex-grows; consultant chat in a fixed-width right panel on `md+`.
- **Narrow viewports:** chat opens in a sheet; a floating control toggles it.
- Spacing follows Tailwind scale; radius from shadcn defaults.

## Core surfaces

| Surface | Behavior |
| --- | --- |
| Consultant sidebar | `useChat` stream; reasoning and tool parts visible while the agent runs. |
| Composer | Textarea, submit, optional speech input (Web Speech API). |
| GenUI demo | Existing `/genui-demo` route inside the main column. |
| Settings / auth | Not shipped in this slice. |

## Motion and accessibility

- Respect `prefers-reduced-motion`; avoid decorative motion in the consultant panel.
- Consultant status uses a restrained `aria-live="polite"` region for errors and completion.
- Focus, contrast, and keyboard targets (target WCAG 2.2 AA).
- Speech input requires microphone permission; text input remains available.

## Content and generative UI

- Consultant answers cite curated starter facts only; GenUI compose rules unchanged in `@repo/genui`.
- Client actions are allowlisted (`open-genui-demo`, `toggle-theme`); the model cannot register new actions.

## Verification checklist

- Light/dark, mobile sheet + desktop sidebar, keyboard submit, long transcripts, tool error states, denied microphone.

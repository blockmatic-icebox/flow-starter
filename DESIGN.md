# Design template

> Replace this file with your visual and interaction contract. Functional scope lives in [PRODUCT.md](PRODUCT.md).

## Visual direction

_Describe the overall aesthetic (density, tone, references). Flow Starter ships neutral ChatGPT-like surfaces until you define brand tokens here._

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

- _Sans family for UI and reading._
- _Monospace for code and tabular data._
- _Scale (body, UI, metadata, headings)._

## Layout

- _Breakpoints and shell structure (header, sidebar, panels)._
- _Spacing and radius scale._

## Core surfaces

| Surface              | Behavior                                             |
| -------------------- | ---------------------------------------------------- |
| _Chat / composer_    | _Input, streaming, errors, cancellation._            |
| _Generative results_ | _How composed UI appears; loading and empty states._ |
| _Settings / auth_    | _Sign-in pattern and account entry points._          |

## Motion and accessibility

- _Respect `prefers-reduced-motion`._
- _Focus, contrast, and keyboard targets (target WCAG 2.2 AA)._
- _Live regions for async updates (restrained, not every token)._

## Content and generative UI

- _Which components the model may compose (allowlists)._
- _What the model must never control (raw CSS, arbitrary URLs, privileged actions)._

## Verification checklist

- _Light/dark, mobile, keyboard, long content, error states._

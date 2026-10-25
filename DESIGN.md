# Design

## Experience direction

**Feature Intelligence** uses a **neutral, restrained, content-first** interface on the **[Meta CTO](https://www.metacto.com/) design system**—warm cloud surfaces, ink typography, orange primary actions, teal focus and secondary accents. Patterns keep **ChatGPT-inspired clarity** (obvious states, readable type) without implying a chat product. **FI workflows are structured screens**, not a single assistant thread.

**Implemented today:** Feature Intelligence under `apps/web/app/(fi)/` — persona home, discover, submit (`?context=external|internal`), detail, inline triage, insights, ask-only `/chat`. Meta CTO tokens via `@repo/ui`; `FiShell` nav with triage badge. Theme toggle on root layout (`d` hotkey).

Product copy and labels should match [GLOSSARY.md](GLOSSARY.md) (e.g. **disposition**, **problem statement**, **intake link**).

## User journeys (accepted v1.3)

Full spec: **[docs/specs/feature-intelligence-journeys.md](docs/specs/feature-intelligence-journeys.md)** (personas, UI detail, AI UX cross-links). Patterns: **[feature-intelligence-ai-ux-patterns.md](docs/specs/feature-intelligence-ai-ux-patterns.md)**.

**Home** acts as a **persona router** — four intents: Share feedback (external), Log feedback (internal), Review queue (PM), See outcomes (leader). Nav badge on Triage when open queue &gt; 0.

| Persona | Streamlined path | UI tone |
| --- | --- | --- |
| External submitter | Home → submit → thank-you (no PM jargon) | “Feedback”, “similar ideas” |
| Internal submitter | Home → paste → duplicates first | Duplicate prevention |
| PM | Home/Triage → expand row → disposition | Glossary terms |
| Leader | Home → Insights → optional audit | Read-only metrics |

**Demo script (recording direction only—not in-app):** Insights glance → PM triage (×2) → Insights refresh → optional live external submit. No Loom or recorder integration in the product.

## Feature Intelligence — screens (accepted)

Spec: [docs/specs/feature-intelligence.md](docs/specs/feature-intelligence.md). Product name in UI: **Feature Intelligence** (subtitle: turn feedback into decisions).

| Route | Screen | Layout / behavior |
| --- | --- | --- |
| `/` | Home (persona router) | Four intent cards + Browse secondary; not a flat feature list |
| `/requests` | Discover | List + filter by `theme_key`; cards show problem one-liner, theme label, source, support |
| `/requests/new` | Submit | Step 1 form → step 2 triage preview (editable problem, duplicate link default, confirm) |
| `/requests/[id]` | Detail | Main: problem, description, brief; sidebar: support, disposition audit, transparency |
| `/triage` | PM queue | Table or `Item` list; **inline expand panel** for disposition (not dialog-first); `pm_review_started_at` on first expand |
| `/insights` | Metrics | Persona hero + metric cards (no charts MVP); sample `n` + proxy footnotes |
| `/chat` | Ask-only help | `max-w-2xl` thread; **no** tool UI; secondary nav item |

### Interaction principles

- **Triage is not chat** — submit flow uses cards and explicit confirm/publish.
- **Primary actions:** Publish request / Submit feedback (persona), Save disposition.
- **Destructive:** Decline disposition (same form; no separate destructive button style required in MVP).
- **Metrics UI:** Show `medianPmTriageMs` only when `pmTriageN >= 2`; otherwise footnote proxy if needed.
- **Motion:** Skeleton on triage loading only; toast on disposition save; keep demo recording calm.
- **AI UX:** Submit loading uses harness **stage labels** + time estimate; human confirm before publish/disposition. Pattern map: [feature-intelligence-ai-ux-patterns.md](docs/specs/feature-intelligence-ai-ux-patterns.md) ([AI UX Playground](https://www.aiuxplayground.com/patterns)).

### App shell (FI)

Sticky header: brand + Browse · Submit · Triage (badge when queue &gt; 0) · Insights. Main content uses route `max-w` from [journeys spec](docs/specs/feature-intelligence-journeys.md#ui-detail-design-system) (`xl` submit, `5xl` triage). Home remains persona **card grid** (`sm:grid-cols-2`), not four equal nav destinations.

### Component map (prefer `@repo/ui`)

| UX need | Primitive |
| --- | --- |
| Persona home, thank-you, metrics | `Card`, `Button`, `Badge` |
| Submit form | `Field`, `FieldLabel`, `Input`, `Textarea`, `Collapsible` |
| Duplicate pick | `RadioGroup`, `FieldSet` |
| Triage queue + inline review | `Table` / `Item`, `Collapsible` or `Accordion`, `Select`, `Textarea` |
| Empty queue | `Empty`, `EmptyTitle` |
| Loading triage | `Skeleton`; submit uses `Spinner` + `aria-live` |
| Insights | `Card` grid only (defer `Chart`) |
| Detail audit | `Collapsible`, sidebar at `lg` |
| Feedback | `toast` after disposition |

### Deferred / cut-if-late

- Markdown export of briefs

## Design system

Shared UI: `@repo/ui` (**shadcn primitives**, **Meta CTO tokens**—not the default neutral shadcn theme). Import tokens and primitives from the package; do not fork token values in `apps/web`. Brand reference: [metacto.com](https://www.metacto.com/).

### Color and themes

Semantic **oklch** tokens in `packages/ui/src/styles/globals.css`, mapped from Meta CTO palette (`--metacto-*` aliases). Light on `:root`; dark on `.dark` (`next-themes`).

**Light `:root` parity** (must match `globals.css`):

| Token                  | Value                   |
| ---------------------- | ----------------------- |
| `--background`         | `var(--metacto-cloud)`  |
| `--foreground`         | `var(--metacto-ink)`    |
| `--primary`            | `var(--metacto-orange)` |
| `--primary-foreground` | `oklch(1 0 0)`          |
| `--border`             | `var(--metacto-mist)`   |
| `--muted-foreground`   | `var(--metacto-pewter)` |
| `--radius`             | `0.75rem`               |

Meta aliases: cloud `#faf6f0`, ink `#2a3439`, orange `#f18700`, mist `#e8e4de`, pewter `#a8a29e`, teal `#3d7a72` (ring/accent). Cards and popovers use white (`oklch(1 0 0)`).

Cards and popovers stay **white** on cloud background for contrast (metacto.com pattern).

### Typography

- **Sans:** Inter (`--font-sans`) on root layout—body and UI.
- **Heading:** Barlow (`--font-heading-family`)—`font-heading` on Card titles, dialogs, empty states.
- **Mono:** Geist Mono for code and keyboard hints.
- Body: `text-sm`, comfortable line height; headings `font-medium` / Barlow semibold, modest scale.

### Components

Primitives under `packages/ui/src/components/`. FI routes should compose Button, Input, Textarea, Select, Card, Badge, Dialog, Collapsible before new variants.

## Layout and responsive behavior

Root layout: `ThemeProvider`, `NuqsAdapter`, Inter + Barlow + Geist Mono (`apps/web/app/layout.tsx`). FI routes use journey `max-w` targets (`max-w-xl` submit, `max-w-4xl` discover, wider triage list).

## Accessibility

- `lang="en"` on `html`.
- Theme hotkey `d` disabled when focus in inputs/editables.
- FI flows: keyboard-accessible **inline triage** disposition controls; transparency `Collapsible` with visible focus.

## Verification

FI UI: **manual** W-* checklist ([testing spec](docs/specs/feature-intelligence-testing.md))—logged in [20261025-fi-browser-verification.md](docs/research/20261025-fi-browser-verification.md); starter Playwright smoke only (homepage). agent-browser per [.agents/flow/operations/verification.md](.agents/flow/operations/verification.md).

## Implementation references

| Area | Location |
| --- | --- |
| Tokens | `packages/ui/src/styles/globals.css` |
| Theme provider | `packages/ui/src/components/theme-provider.tsx` |
| App layout | `apps/web/app/layout.tsx` |
| FI shell + routes | `apps/web/app/(fi)/` |
| Ask-only chat API | `apps/web/app/api/chat/route.ts` |
| Submit loading (W-9) | `apps/web/app/(fi)/requests/new/submit-form.tsx` (`aria-live`, stage labels) |

## Evolution

Update this file in the same change as material UI or token changes. Mark proposals until accepted; no empty section headings.

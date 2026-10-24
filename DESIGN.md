# Flow — Design

> Accepted visual direction for implementation. Tokens are the source for color and type. Dimensions are starting values, not a Vercel clone. Functional scope lives in [PRODUCT.md](PRODUCT.md). This document owns presentation, including loading, activity, outcomes, and recovery across chat, canvas, and voice.

## Visual direction

Technical minimalism inspired by Geist: neutral surfaces, clear hierarchy, restrained borders, precise typography, and moderate density. Green connects Flow to Gabo's personal brand. Content and its sources should stand out more than the interface.

Use Geist Sans for reading and controls; Geist Mono for code, identifiers, and aligned numbers. [Vercel's article on DESIGN.md](https://vercel.com/blog/how-our-agents-build-on-brand-pages-with-design-md) is a reference for expressing visual decisions as concrete rules that agents can reuse.

## Color and tokens

**Brand verification:** on October 16, 2026, computed styles were inspected on [gaboesquivel.com](https://gaboesquivel.com/). The “gabo” and “More work” links displayed `rgb(84, 232, 179)`, equivalent to **`#54E8B3`**, in the observed dark presentation. This verifies a visible accent; it does not establish that it is the only brand token or that an official light palette exists.

Keep that green in dark mode and derive a darker green for light mode. The previously discussed GitHub references `#2DA44E` and `#3FB950` remain color alternatives, not values extracted from the personal website or a requirement to follow a particular version of Primer.

| Semantic token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#FFFFFF` | `#0A0A0A` | Workspace background |
| `surface` | `#FAFAFA` | `#111111` | Panels and cards |
| `surface-hover` | `#F0F0F0` | `#1C1C1C` | Restrained interaction feedback |
| `foreground` | `#171717` | `#EDEDED` | Primary text |
| `muted-foreground` | `#595959` | `#A3A3A3` | Readable metadata |
| `border` | `#E5E5E5` | `#2B2B2B` | Decorative separators |
| `control-border` | `#767676` | `#737373` | Boundaries needed to identify controls |
| `brand` / `ring` | `#087F5B` | `#54E8B3` | Links, focus, and selection |
| `brand-foreground` | `#FFFFFF` | `#062B20` | Text on green buttons |
| `brand-subtle` | `#E8F8F0` | `#102A20` | Selection background |
| `danger` | `#B42318` | `#FF8A80` | Errors with text/icons |

`success` can initially share the value of `brand`, but must be an independent token. Brand color alone does not indicate that an operation finished. Map tokens to CSS variables and shadcn; do not scatter hex values across generated components. Validate actual contrast pairs, including hover, disabled, selection, and charts, before finalizing the design.

## Composition and dimensions

- Restrained header around 56 px tall: Flow, Docs access, theme selector, and account.
- Desktop: flexible canvas, approximately 68–72% of the usable area; right chat panel initially 380 px wide, adjustable within an approximate 320–480 px range. The divider is keyboard accessible.
- Each panel scrolls independently. The composer remains accessible at the bottom of chat; new responses do not pull users away from older messages they are reading.
- Below approximately 900 px, use Chat/Canvas tabs instead of two unreadable columns. Show a discreet indicator when an artifact appears in the inactive tab.
- Spacing: 4, 8, 12, 16, 24, 32, and 48 px. Radii: 6 px for controls, 8 px for panels, and 12 px for dialogs. Borders are 1 px; reserve shadows for overlays.
- Conversation text: 15–16 px with line height around 1.6; UI: 14 px; metadata: 12–13 px; headings: 20–24 px. Avoid landing-page headings inside the workspace.

These dimensions are starting values to adjust for content and available width, not a requirement to preserve percentages at every resolution.

## Entry and generation

At `/dev`, center a Google-like prompt bar in the empty left canvas, with the label “What do you want to explore?” and an explicit submit button. Keep chat on the right. Place PRODUCT's four suggested prompts near the input; selecting one fills an editable draft. Enter submits; preserve multiline composition and keyboard access.

The prompt bar and chat composer feed the same conversation. After submission, show the request in chat and use the left area for the artifact. Follow-ups use the right-side composer. Offer “New conversation” inside the workspace to restore the empty prompt without navigating to another URL. Preserve the current conversation and artifact until the user deliberately starts or selects another.

During canvas generation or updates, show a concrete activity label, such as **“Building architecture view...”**, with three small dots gently bobbing in sequence: translate vertically by 3 px over a 900 ms ease-in-out loop, with 120 ms stagger. Keep text stationary and readable; animate transforms only. Show activity in a compact status region when an artifact already exists, preserving that artifact rather than blanking the canvas. Stop the animation on success, failure, or cancellation and offer a way to stop ongoing generation. This is indeterminate activity, never a fake percentage.

Use a polite status announcement once per operation, not on every animation cycle. Decorative dots are hidden from assistive technology. With reduced motion, keep the same text and static dots. Chat is the primary execution surface from the first text-chat step: show concrete activity such as “Reading source files,” expandable sanitized operation details, and confirmed outcomes. The canvas uses the activity label only while generating or updating an artifact. Text-only questions leave the canvas unchanged. On lost connectivity, stop the motion and say the status is uncertain. Errors use clear, direct language.

## Components and behavior

Use Tailwind and shadcn/ui components with **Base UI** primitives. Check the variant of each installed component; do not inadvertently substitute Radix. Components in the json-render catalog reuse the same wrappers and tokens.

| Surface | Rule |
| --- | --- |
| Empty canvas | Prominent generation prompt and suggested requests; same `/dev` URL throughout. |
| Empty chat | Briefly explains that follow-ups can update the canvas; suggestions live beside the main prompt. |
| Artifact | Title, spacious content, citations beside supported claims, and update status; a few contextual controls. |
| Selection | Border/indicator and text label; show the selected object near the chat composer. |
| Agent activity | One current summary and expandable safe operation rows; no raw reasoning or private tool inputs. |
| Error | Explains what failed, which result remains available, and how to retry. |
| Login | One action: “Continue with GitHub.” Preserve the draft through the redirect. |
| Video (follow-on) | Thumbnail or placeholder, explicit playback, and an alternative link; no autoplay. |

The model chooses content and permitted composition, not fonts, arbitrary sizes, CSS, or new colors. Do not turn every answer into a chart. Chat explains; the canvas holds the visual result.

## Voice surface (follow-on)

Keep voice controls inside the `/dev` workspace. Provide a microphone entry point, clear listening/thinking/speaking states, mute, interruption, and an explicit end-session control. A compact waveform or orb may indicate activity without covering the canvas or replacing chat. Honor reduced motion with static state labels. Microphone permission is requested only when the user starts voice.

Distinguish editable dictation, which fills the prompt for review, from live voice conversation, which can request canvas actions and speak their results. Show completed spoken turns and confirmed action outcomes in the current chat; do not resubmit displayed transcripts as new requests. Keep source links in chat or the artifact rather than reading URLs aloud. While voice-triggered generation runs, use the same “Building architecture view...” canvas state.

Interrupting playback is distinct from cancelling work; make both states understandable. Microphone denial, provider failure, or disconnection leaves text input and the last valid canvas usable. Ending voice returns to text in the same conversation and at the same URL.

## Diagrams, tables, and follow-on charts

Mermaid backgrounds and text follow the theme; include a textual description and basic zoom/fit controls. Initial selection targets the diagram block, not internal SVG nodes; node-level selection requires a specific later implementation.

When charts are added, Recharts uses green for the primary series and a small secondary palette for comparisons. Add legends, units, labels, and an equivalent table. Select by stable identity, never by array position. Do not truncate axes misleadingly or turn unknown values into zero.

## Accessibility and states

Target WCAG 2.2 AA: at least 4.5:1 contrast for normal text; at least 3:1 for essential indicators and controls where applicable. Provide visible focus, accessible control names, keyboard navigation, focus restoration after overlays close, and reduced-motion support. Do not rely only on hover or color.

Explicitly design empty, loading, streaming, success, error, partial-data, no-results, expired-session, deleted-selection, and version-conflict states. Announce meaningful changes through a restrained live region without reading every token. Prefer discreet 120–180 ms transitions and disable them when reduced motion is requested.

## Visual delivery check

Verify light/dark, 1440 px, 1024 px, and narrow mobile layouts; complete keyboard navigation; long tables; large diagrams; lengthy messages; tool errors; and expired sessions. Confirm that the canvas selection is identifiable from chat without opening a technical inspector. Verify the search-to-chat handoff, unchanged `/dev` URL, animated and reduced-motion loading states, cancellation, and preservation of the previous artifact on failure. Do not use neon, conspicuous gradients, glassmorphism, or large green surfaces.

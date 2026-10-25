# Feature Intelligence

Functional requirements live in [PRODUCT.md](PRODUCT.md). Technical boundaries live in [ARCHITECTURE.md](ARCHITECTURE.md). The first slice is [the feature-intelligence initiative](docs/initiatives/feature-intelligence.md).

## Experience vision

A product manager can tell, on one request, how much support it has and what the model thinks it is worth strategically, then record their own decision. The screen stays understandable when the model produces nothing.

## Experience principles

- Popularity and strategic value are separate facts.
- The human decision is the priority that gets stored.
- A missing recommendation is a visible state.
- Use the inherited `@repo/ui` components and tokens.

## Users and contexts

Primary context: a PM at a desk, desktop width, reviewing a short list of requests during triage. Keyboard access to submit, support, confirm, and override. Mobile can stack the same fields. The first slice targets WCAG 2.2 AA for those controls.

## Information architecture

- `/` — product home.
- `/requests` — list of requests with support count and recorded decision when one exists.
- `/requests/new` — title and description.
- `/requests/[id]` — request, support action, popularity, strategic recommendation, confirm, and override.

Share the request id in the path. Filter or search state can use the URL when the list needs it.

## Core experiences

| Experience | User goal | Expected interaction | Important states |
| --- | --- | --- | --- |
| Submit | Capture a request | Form with title and description | Validation error, saved |
| Discover | Find a request | List, then the detail path | Empty list, match, missing id |
| Support | Show demand | One support action | Count updates |
| Decide | Record a priority | Read both signals, confirm or override | Recommendation present, recommendation empty, saved decision |

## Visual direction

Use `@repo/ui` as the visual system. Hierarchy is the request title, then the two signals, then the human action. Add product components only where the shared set has no equivalent.

## Brand and design tokens

Map color, type, spacing, and radius to the shared tokens. The recommendation and the human decision need distinct labels so a count never reads as the priority.

## Layout and responsiveness

Desktop: list and detail keep a single reading column with the two signals side by side when width allows. Narrow widths stack popularity, recommendation, and the decision actions in that order.

## Interaction and state

Submit stays disabled until title and description are present, and the error names the missing field. Support updates the count on the detail view. Confirm stores the recommendation as the decision. Override stores the PM's choice and shows it as the recorded decision after refresh.

## Agentic and generative experiences

The model recommends. It does not write the stored priority. The PM sees the recommendation text, the strategic judgment, and any related or conflicting requests. Confirm and override are explicit buttons.

Empty, loading, and failure states:

- Loading: the request is visible and the recommendation area says it is working.
- Empty recommendation: the model key is missing, the call failed, or the request text attempted to steer the outcome. The copy says no recommendation was produced.
- Saved decision: the human choice remains after refresh.

Request text is quoted to the model as data.

## Accessibility

Label the form fields. Name the support, confirm, and override buttons. Keep focus on the form when validation fails. Announce the recommendation result and the saved decision. Honor reduced motion from the shared theme.

## Verification

Browser check for the first slice: submit a valid request, reject a missing title, find the request, add support, see a recommendation or the empty state, confirm or override, and reload the detail page onto the same decision. Cover the retired `/features` URLs as absent.

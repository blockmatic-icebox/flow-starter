# Flow principles

Each practice below follows a simple pattern: the problem, what Flow chooses, the benefit, the cost, and a concrete example.

## Name uncertainty early

**Problem:** Teams build before they agree what is unknown.

**Choice:** Explore and Specify surface assumptions, scope, and acceptance criteria before large implementation.

**Benefit:** Cheaper changes of direction.

**Trade-off:** Substantial work needs explicit approvals; that is intentional, not bureaucracy for every typo.

**Example:** Team comments start with “who needs this and how will we know it helps?” not with a database schema.

## Small increments

**Problem:** Large batches hide integration risk and blur accountability.

**Choice:** Plan vertical slices; implement the smallest useful change consistent with accepted decisions.

**Benefit:** Each slice can be verified before the next grows.

**Trade-off:** More frequent alignment.

**Example:** One comment thread before notifications and permissions.

## Evidence over optimism

**Problem:** Working code feels like proof of value.

**Choice:** Review and Ship distinguish technical correctness from product outcome; record evidence or state what remains unknown.

**Benefit:** Fewer self-deceiving launches.

**Trade-off:** Honest “we do not know yet” takes discipline.

**Example:** A green test on date sorting does not prove invoices help users get paid faster.

## Maintained context

**Problem:** Agent sessions end; chat history does not own the product.

**Choice:** One authoritative home per fact in repository documents; agents read only what the task needs ([flow.md](../flow.md)).

**Benefit:** Fresh sessions can recover intent.

**Trade-off:** Someone must update the owning doc when decisions change.

**Example:** Initiative holds comment assumptions; `PRODUCT.md` changes only if the whole product promise shifts.

## Selective skills

**Problem:** Loading every installed skill wastes attention and implies ceremony.

**Choice:** Flow routes the smallest skill set for current uncertainty ([operations/skills.md](../operations/skills.md)); skills supply methods, Flow owns locations and naming.

**Benefit:** Right method without catalog theater.

**Trade-off:** You still choose when discovery skills matter.

**Example:** A sort fix may need `test-driven-development`; a new idea may need `problem-validation`—not both by default.

## Verification fit for the change

**Problem:** Either skipping checks or running the entire suite for a one-line fix.

**Choice:** Report named commands and exit codes; use deterministic checks where they apply; add judgment for intent and security boundaries.

**Benefit:** Trustworthy Ship reports.

**Trade-off:** Agents cannot replace your approval on consequential decisions.

## Justified delegation

**Problem:** Solo work is simple; substantial work benefits from parallel investigation or builders.

**Choice:** Consider delegation when independence and elapsed time justify it; default coordination rules live in [operations/delegation.md](../operations/delegation.md).

**Benefit:** Faster discovery or build without surrendering human control.

**Trade-off:** Integration and conflicting edits still need a coordinator.

**Example:** One agent explores pricing models while another spikes UI—after explicit **Build** authorization for implementation tasks.

## Judgment, not a checklist

Curiosity can start exploration. When work becomes a product commitment, make intent and how you will learn explicit. Flow aims for proportionate process, not a stage badge on every commit.

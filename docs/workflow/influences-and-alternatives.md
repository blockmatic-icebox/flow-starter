# Influences and alternatives

Flow combines repository coordination with selected upstream skills. Competitor notes come from an **October 2026 research pass** ([summary](../research/20261024-flow-methodology-influences.md)); external claims were **not reverified** for this guide.

## What Flow needed

| Need | How Flow addresses it |
| --- | --- |
| Engineering execution | Installed agent skills for refine, specify, plan, build, test, review, ADRs |
| Shared language and agent-readable docs | Adapted progressive disclosure and glossary discipline |
| Discovery and experiments | Installed ProductSkills methods where uncertainty is product-shaped |
| Customer learning mindset | Conceptual Lean Startup / continuous discovery—not extra installed skills |

Dozens of other skills in `skills-lock.json` (Vercel, Expo, UI, database, and so on) support **Flow Starter’s stack**. They are not Flow methodology influences.

## Directly used skills

From [skills-lock.json](../../skills-lock.json) and [agents/skills.md](../agents/skills.md):

| Source | Installed skills | Why they fit |
| --- | --- | --- |
| [Addy Osmani agent-skills](https://github.com/addyosmani/agent-skills) | `idea-refine`, `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `test-driven-development`, `code-review-and-quality`, `documentation-and-adrs` | Cover refinement through delivery and decision records; `idea-refine` includes product thinking |
| [Matt Pocock skills](https://github.com/mattpocock/skills) | `domain-modeling`, `writing-for-agents` | Terminology maintenance and how agent-facing docs are structured |
| [ProductSkills](https://github.com/assimovt/productskills) | `problem-validation`, `prd-writing`, `experiment-design` | Discovery, requirements, and experiments when justified |
| Local | `flow-eval` | User-invoked evaluation runner only—not a “understand Flow” methodology skill |

There is **no** skill named `flow` in the manifest.

**What Flow adds:** when to load a skill, approval boundaries, and canonical file locations (for example, sustained plans live in initiatives, not the planning skill’s default `tasks/plan.md`).

**What stays upstream:** the method inside each skill’s `SKILL.md`.

## Adapted practices

- **Progressive disclosure** — route agents to depth on demand (influenced by Matt Pocock’s writing-for-agents work; house rules in [flow.md](flow.md)).
- **One fact, one home** — link instead of duplicating ownership tables.
- **Glossary discipline** — project-specific terms in [GLOSSARY.md](../../GLOSSARY.md) for this starter; your product replaces them when adopting.
- **Proportionate discovery** — discovery methods when uncertainty warrants them, not a mandatory business-planning phase.

Conceptual influences (not installed as skills): [Lean Startup principles](https://theleanstartup.com/principles), [continuous discovery](https://www.producttalk.org/getting-started-with-discovery/) as reasoning aids for customer learning.

## Investigated, not adopted

An October 2026 competitive review compared workflow frameworks and skill libraries. **ADOPT/REJECT labels in that report were proposals**, not decisions in this repository. Lessons below are **report lessons**, not proof those tools lack capability today.

| Tool | Why investigated | Lesson recorded then | Trade-off noted | Status here |
| --- | --- | --- | --- | --- |
| [Superpowers](https://github.com/obra/Superpowers) | Engineering discipline benchmark | Brainstorm and plan before code; worktree isolation | Heavy approval/planning gates for solo default | Not adopted |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | Spec-before-code workflows | Specify → plan → tasks is table stakes | Weak systematic customer evidence in that review | Not adopted |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Markdown artifact workflows | Plain Markdown as durable interchange | Explore ≠ rigorous discovery in that review | Not adopted |
| [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | Full product-to-code breadth | Demand exists for integrated lifecycle | Flow chose restraint over persona catalog | Not adopted |
| [Archon](https://github.com/coleam00/Archon) | Deterministic harness ideas | Gates around AI work are valuable at scale | Custom orchestrator rejected for early Flow | Not adopted |
| Flow-named repos (several) | Namespace collision | Provenance and receipts ideas; avoid `.flow/` as canonical docs | Crowded name; point-in-time claims | Not dependencies |
| Extra discovery skill packs | Packaging options | Risk-based discovery; rigid thresholds questioned | Not in manifest | Not installed |

**Report lessons Flow keeps:** Markdown in-repo as truth; product evidence and engineering discipline differ; a small routed skill set beats a large catalog for this starter.

Historical open items (not current Flow): standalone “explain Flow” skill packaging, mandatory OMTM, validation board artifact.

## Further reading

- Skill routing: [agents/skills.md](../agents/skills.md)
- Curated evidence and public links: [20261024-flow-methodology-influences.md](../research/20261024-flow-methodology-influences.md)

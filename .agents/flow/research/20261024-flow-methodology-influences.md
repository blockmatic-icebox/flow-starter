# Flow methodology influences — curated summary

**Research date:** 2026-10-24  
**Last reviewed:** 2026-10-24  
**Status:** Historical

This note supports the human guide under [.agents/flow/guides/](../guides/). It summarizes **selection rationale and research limits** in this repository’s words. It does not import the full October 2026 competitive report or treat that report’s ADOPT/REJECT table as accepted project policy.

## Provenance

- **Current implementation:** [skills-lock.json](../../skills-lock.json), [.agents/flow/operations/skills.md](../operations/skills.md), [.agents/flow/flow.md](../flow.md).
- **Earlier direction (evidence only):** methodology research consolidated in a separate historical repository at commit `94d43fd` (2026-10-24). That repository’s `PRODUCT.md`, `docs/principles.md`, `docs/methodology.md`, and `docs/references.md` informed audience and practice wording; they do not govern Flow Starter.

## Installed methodology skills

| Publisher | Repository | Skills in manifest |
| --- | --- | --- |
| Addy Osmani | https://github.com/addyosmani/agent-skills | `idea-refine`, `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `test-driven-development`, `code-review-and-quality`, `documentation-and-adrs` |
| Matt Pocock | https://github.com/mattpocock/skills | `domain-modeling`, `writing-for-agents` |
| ProductSkills | https://github.com/assimovt/productskills | `problem-validation`, `prd-writing`, `experiment-design` |
| Local | `./.agents/skills/flow-eval` | `flow-eval` (evaluation CLI only) |

No skill named `flow` is listed in the manifest.

## Adapted concepts (not full skill adoption)

- Progressive disclosure and agent routing — influenced by [writing-for-agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md); enforced via Flow document ownership.
- Shared language maintenance — influenced by [domain-modeling](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md) and glossary practice; adopters use [GLOSSARY.md](../glossary.md).
- Customer learning mindset — [Lean Startup principles](https://theleanstartup.com/principles), [Product Talk discovery](https://www.producttalk.org/getting-started-with-discovery/) as conceptual references; not installed as standalone Flow skills.

## Competitive landscape review (October 2026)

A detailed comparison was drafted in historical research dated 2026-10-20. Its status line stated that **claims were not independently reverified** during cleanup and that **recommendations labeled ADOPT or REJECT were proposals**, not Flow decisions. Primary-source links preserved there include, among others:

- https://github.com/github/spec-kit
- https://github.com/Fission-AI/OpenSpec
- https://github.com/bmad-code-org/BMAD-METHOD
- https://github.com/obra/Superpowers
- https://github.com/addyosmani/agent-skills
- https://github.com/coleam00/Archon

Flow Starter’s human guide ([influences.md](../guides/influences.md)) uses **report lessons** from that pass until a separate verification task reverifies external behavior. Weak scoring in the report meant “not materially evidenced in that review,” not “proven absent.”

## Open historical proposals (not current policy)

Examples recorded in historical reconciliation notes: mandatory `.flow/` doc roots, unified decision directories, automated drift tooling as v0 requirements, standalone methodology-learning skill packaging, validation board as a shipped artifact, OMTM as a mandatory Flow practice, and product rename for namespace collision. None of these are asserted as implemented in [flow.md](../flow.md).

## Related documents

- [flow-human-guide.md](../initiatives/flow-human-guide.md) — initiative tracking this guide
- [flow-evaluation-suite.md](../initiatives/flow-evaluation-suite.md) — harness scope
- [flow-improvement-loop.md](../initiatives/flow-improvement-loop.md) — human-reviewed remediation process

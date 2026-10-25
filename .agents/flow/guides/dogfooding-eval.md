# Dogfooding and evaluation

Real product development produces observations. Evaluations test hypotheses with frozen acceptance criteria.

## Improvement pipeline

```text
Product development
  → local gitignored prompt log (optional) + records/*.md (observations)
  → recurring failure pattern
  → evaluation scenario (when justified)
  → proposed remediation
  → human approval
  → Flow Build on Factory or product
  → regression checks (pnpm --dir .agents flow-eval:check, product QA)
```

Do not auto-create scenarios from every journal entry. Do not let eval subjects change rubrics to improve scores. Official arm comparison stays blocked until [ADR 0015](../decisions/adr/0015-evaluation-subject-separation.md) isolation requirements are met.

## Flow improving Flow

Use the same Explore → Ship activities. Entry: user-invoked `flow-improve` skill. Consequential methodology edits require explicit human approval after evidence and smallest viable change are documented.

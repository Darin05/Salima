# ponytail-gain

Display the ponytail benchmark scoreboard. One-shot display, no file changes.

## Trigger
`/ponytail-gain`, "ponytail gain", "what does ponytail save", "show ponytail impact", "ponytail scoreboard"

## Display (ASCII bar charts)

Show benchmark medians from published results (5 everyday tasks, 3 Claude models):

```
PONYTAIL IMPACT (benchmark medians — not this repo)

Lines of code written
  Baseline  ████████████████████████████████████████ 100%
  Ponytail  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 6–20%
  Reduction: 80–94%

Cost
  Baseline  ████████████████████████████████████████ 100%
  Ponytail  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 23–53%
  Savings:  47–77%

Speed
  Baseline  ████████████████████████████████████████ 1×
  Ponytail  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 3–6× faster
```

Note: These are benchmark medians, not this repo's numbers. Per-repo metrics come from `/ponytail-debt`.

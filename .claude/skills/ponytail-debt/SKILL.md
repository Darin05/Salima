# ponytail-debt

Harvest all `ponytail:` comments from the codebase and produce a technical debt ledger.

## Trigger
`/ponytail-debt`, "ponytail debt", "list the shortcuts", "what deferrals remain"

## Steps
1. Run: `grep -rn "ponytail:" . --include="*.py" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git`
2. For each match, format as:
   `<file>:<line>, <what was simplified>. ceiling: <the limit named>. upgrade: <the trigger to revisit>.`
3. Flag entries without an upgrade trigger with `[no-trigger]` — these are silent accumulation risks.
4. Summarize: total markers found, how many lack upgrade triggers.
5. If asked, write results to `PONYTAIL-DEBT.md`.

## This is a one-shot report — no changes are applied.

# ponytail-audit

Scan the entire repository for over-engineering. Codebase-wide version of ponytail-review.

## Trigger
`/ponytail-audit`, "audit for bloat", "find over-engineering in the codebase"

## Steps
1. Walk the project tree (skip node_modules, .git, build dirs).
2. Identify files with the most unnecessary complexity.
3. Produce a ranked list, largest cuts first.
4. Format each finding: `<tag> <what to cut>. <replacement>. [path]`
5. End with: `net: -<N> lines, -<M> deps possible`

## Finding Categories
- **delete**: unused code, speculative features
- **stdlib**: hand-rolled functionality standard libraries provide
- **native**: platform capabilities reimplemented via dependencies
- **yagni**: single-implementation abstractions, unnecessary layers
- **shrink**: logic that could use fewer lines

## Scope
Over-engineering and complexity only. Correctness, security, and performance are out of scope.
This is a one-shot report — no changes are applied.

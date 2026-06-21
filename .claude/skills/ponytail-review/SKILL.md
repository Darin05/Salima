# ponytail-review

Review the current diff for over-engineering only. Hunt complexity, not bugs.

## Trigger
`/ponytail-review`, "review for over-engineering", "simplify review", "what can we delete?"

## Steps
1. Run `git diff` to get the current diff.
2. Scan each changed hunk for the five finding categories below.
3. Report findings in the format: `L<line>: <tag> <what>. <replacement>.`
4. End with: `net: -<N> lines possible`

## Finding Categories
- **delete**: dead code, unused flexibility, speculative feature
- **stdlib**: hand-rolled functionality the standard library provides
- **native**: dependencies or code duplicating platform features
- **yagni**: abstractions with a single implementation or single caller
- **shrink**: identical logic that can be expressed more concisely

## Scope (strictly enforced)
- IN scope: unnecessary complexity, over-engineering
- OUT of scope: correctness bugs, security issues, performance problems

Success = lines of code eliminated.

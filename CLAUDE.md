@AGENTS.md

## Claude Code Specific Instructions

Use Claude Code primarily for planning, architecture review, refactor strategy, risk analysis, code review, and documentation review.

Before broad edits:

1. Read AGENTS.md.
2. Read the key frozen/baseline docs listed in AGENTS.md.
3. Query or inspect graphify-out/graph.json if available.
4. Explain the plan before structural changes.
5. Do not edit the same files that Codex is currently editing.

Claude/Linux Graphify refresh:

~~~bash
./scripts/graphify.sh update .
~~~

If semantic Markdown graph extraction needs an API key, report that blocker and continue with direct documentation inspection.

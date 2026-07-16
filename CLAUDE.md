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

<!-- AI-WORKSPACE-CONTEXT-FALLBACK -->

## Obsidian Fallback Context

The central Obsidian vault lives at:

~~~text
C:\Users\user\Documents\00 AI agent\AI-Knowledge
~~~

Some Codex or Claude sessions mount only this project folder. If the live vault is outside the current sandbox, read this local bridge instead:

~~~text
docs\AI_WORKSPACE_CONTEXT.md
~~~

Use the bridge only for architecture rationale, ADRs, roadmap context, cross-project standards, and workspace operating context. Do not use it as a replacement for project docs, Graphify, or source inspection.

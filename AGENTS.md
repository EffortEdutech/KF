# AGENTS.md

## Project Identity

Project name: KF / Knowledge Factory

Knowledge Factory is a professional knowledge manufacturing platform. It transforms trusted source material into governed, versioned, reusable Professional Knowledge Assets through an AI-assisted production process with human governance.

This repository is part of the Effort Studio AI development workspace.

Central Obsidian vault:

~~~text
C:\Users\user\Documents\00 AI agent\AI-Knowledge
~~~

## Key References

Start with these Version 1 frozen/baseline documents:

- `docs/v1/00 - Knowledge Factory Documentation Series - Version 1.0 Frozen.md`
- `docs/v1/01 - Documentation Architecture - Version 1.0 Frozen.md`
- `docs/v1/KF 1_0 - Vision, Philosophy & Product Strategy.md`
- `docs/v1/TRY 1/00 - Documentation Map.md`
- `docs/v1/TRY 1/Volume I - Engineering Constitution.md`
- `docs/v1/TRY 1/Volume J - Development Roadmap.md`

Then read the most relevant KF series or TRY 1 volume for the task.

## AI Assistant Operating Rules

Before making changes:

1. Read this AGENTS.md.
2. Read CLAUDE.md only if it adds relevant project-specific guidance.
3. Read the key references above before making assumptions about product scope, architecture, roadmap, or implementation order.
4. Query graphify-out/graph.json if it exists.
5. Inspect project docs or source files directly before editing.
6. Preserve the Version 1 frozen/baseline principles unless the user explicitly asks to revise them.
7. Prefer small, reviewable changes.
8. Do not introduce new production dependencies without approval.
9. Update docs when behavior, architecture, commands, schemas, APIs, or operating rules change.

## Current Project State

Knowledge Factory has entered Sprint 0 implementation.

The frozen architecture source of truth remains `docs/v1`. The active implementation plan is:

- `docs/implementation/KF Build Sprint Plan and Checklist.md`
- `docs/implementation/Pre-Sprint Architecture Audit.md`
- `docs/implementation/setup/Local Development Setup.md`

The current implementation is a standalone-first Next.js Studio app with LADOS-compatible package/module boundaries.

Current structure:

- `apps/studio` - Next.js App Router Studio shell.
- `packages/core` - lifecycle, mission, role, and relationship contracts.
- `packages/db` - Prisma schema and database boundary.
- `packages/ai` - provider/model-router contracts.
- `packages/pka` - PKA manifest and package structure contracts.
- `packages/ui` - shared UI contracts/components.
- `packages/config` - runtime configuration boundary.
- `storage` - local development storage root, with source and export folders.

Do not introduce implementation structure that conflicts with the approved Knowledge Factory documentation or the active sprint plan.

## Architecture Invariants

- Knowledge Factory is a knowledge manufacturing platform, not a chatbot, search engine, document manager, or computer OS.
- Knowledge Objects are the core unit.
- Professional Knowledge Assets are the primary governed output.
- AI assists the manufacturing process; humans govern professional approval.
- Governance, provenance, traceability, validation, review status, and versioning are mandatory.
- Knowledge Factory manufactures PKAs; LADOS is a runtime target that can execute or host PKAs.
- AI provider choices must remain abstracted, including cloud providers and local Ollama-style deployment.
- Sensitive organizational knowledge should not be sent to external AI providers unless explicitly configured.

## Graphify Rules

Use Graphify for project navigation when graphify-out/graph.json exists:

~~~powershell
.\scripts\graphify.ps1 query "question" --graph "graphify-out\graph.json"
.\scripts\graphify.ps1 explain "symbol-or-file" --graph "graphify-out\graph.json"
.\scripts\graphify.ps1 path "A" "B" --graph "graphify-out\graph.json"
~~~

Refresh Graphify after meaningful structure changes:

~~~powershell
.\scripts\graphify.ps1 update .
~~~

~~~bash
./scripts/graphify.sh update .
~~~

The `.ps1` wrapper is for Windows. The `.sh` wrapper is for Linux/macOS and Claude sandboxes; it installs the PyPI package `graphifyy` on demand and then runs `graphify`.

Current scope is documentation-first: `docs/v1`. Markdown semantic extraction requires an LLM API key. Once source folders exist, code-only extraction can run against the monorepo folders.

## Obsidian Rules

Use Obsidian for architecture rationale, ADRs, cross-project standards, roadmap context, meeting notes, and research.

Do not duplicate project implementation docs into Obsidian. Link to repository docs instead.

## Commands

Install dependencies:

~~~powershell
corepack pnpm install
~~~

Run the Studio app:

~~~powershell
corepack pnpm dev
~~~

Build:

~~~powershell
corepack pnpm build
~~~

Lint/type check:

~~~powershell
corepack pnpm lint
~~~

Test:

~~~powershell
corepack pnpm test
~~~

Full check:

~~~powershell
corepack pnpm check
~~~

Start dedicated KF PostgreSQL infrastructure:

~~~powershell
corepack pnpm infra:up
~~~

Stop infrastructure:

~~~powershell
corepack pnpm infra:down
~~~

Prisma generate:

~~~powershell
corepack pnpm db:generate
~~~

Prisma migrate:

~~~powershell
corepack pnpm db:migrate
~~~

Graph refresh:

~~~powershell
.\scripts\graphify.ps1 update .
~~~

## Security Rules

- Never read or print `.env` files.
- Never expose secrets, API keys, service-role keys, private tokens, or credentials.
- Preserve organizational knowledge privacy and local/private deployment assumptions.

## Done Criteria

A task is complete when:

- requested setup or changes are implemented,
- relevant checks were run or blockers are explained,
- documentation is updated if needed,
- Graphify is refreshed after meaningful structural changes when possible,
- the final response explains what changed and how it was verified.

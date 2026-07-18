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

Knowledge Factory has been reset from pilot-first execution to manufacturing-line execution. The controlling milestone is now the reusable KF capability to manufacture governed Base PKAs end to end. The Quantity Surveying / RFQ from BOQ Base PKA remains the current validation article, but it is not the sprint objective.

The frozen architecture source of truth remains `docs/v1`. The active implementation plan is:

- `docs/implementation/KF Build Sprint Plan and Checklist.md`
- `docs/implementation/KF Manufacturing Line Sprint Plan and Checklist.md`
- `docs/implementation/Pre-Sprint Architecture Audit.md`
- `docs/implementation/PKA Anatomy and Runtime Boundary.md`
- `docs/implementation/PKA Component Boundary Decision.md`
- `docs/implementation/PKA Retrieval and Context Engine for App Developers.md`
- `docs/implementation/PKA Export Strategy.md`
- `docs/implementation/PKA Package Installer Contract for Runtime Apps.md`
- `docs/implementation/Ollama Adapter Design Notes.md`
- `docs/implementation/QS RFQ Pilot Source Pack.md`
- `docs/implementation/Runtime Q&A Harness Preparation.md`
- `docs/implementation/Sprint 4 Review Queue Planning Slice.md`
- `docs/implementation/setup/Local Development Setup.md`

The current implementation is a standalone-first Next.js Studio app with LADOS-compatible package/module boundaries.

Current structure:

- `apps/studio` - Next.js App Router Studio shell.
- `packages/core` - lifecycle, mission, role, and relationship contracts.
- `packages/db` - Prisma schema and database boundary, including Knowledge Objects, source evidence, source chunks, KO suggestions, RFQ evidence register entries, RFQ workflow gate actions, governance, graph, and package records.
- `packages/ai` - provider/model-router contracts.
- `packages/pka` - PKA manifest, retrieval context, and package structure contracts.
- `packages/ui` - shared UI contracts/components.
- `packages/config` - runtime configuration boundary.
- `storage` - local development storage root, with source and export folders.

Sprint execution now follows `docs/implementation/KF Manufacturing Line Sprint Plan and Checklist.md`. Current work should prioritize reusable factory capabilities: Source Intake, Preparation and Extraction, KO Manufacturing, Relationship and Evidence Manufacturing, Human Governance, PKA Assembly, Release and Publication, Runtime Handoff, Consumption Validation, and Continuous Improvement. The QS/RFQ validation article currently proves those capabilities with deterministic source ingestion, Markdown/plain-text artifact extraction, source chunks, KO/relationship suggestions, governance, package export, runtime handoff, runtime import, and deterministic Q&A readiness. Relationship evidence remains structured `KnowledgeRelationship.provenance.sourceEvidence`; do not add a dedicated relationship evidence table until two or more independent runtime/app-developer feedback records request multi-source relationship evidence lifecycle. Ollama integration is intentionally deferred until the generic deterministic manufacturing line is stable end to end.

Current Studio routes include Dashboard, Manufacturing Line, Mission Centre, Projects, Sources, Knowledge Objects, Review, Ontology, Pipeline, RFQ Workflow, PKA Builder, Runtime Import, Runtime Handoff, and Runtime Q&A preparation.

Do not introduce implementation structure that conflicts with the approved Knowledge Factory documentation or the active sprint plan.

## Architecture Invariants

- Knowledge Factory is a knowledge manufacturing platform, not a chatbot, search engine, document manager, or computer OS.
- Knowledge Objects are the core unit.
- Professional Knowledge Assets are the primary governed output.
- A PKA is a package-level governed asset composed of smaller knowledge components.
- Distinguish Base PKAs from client-adapted PKA instances and runtime vault state.
- Runtime apps should retrieve focused governed context from PKAs rather than sending whole PKAs or graphs to AI models.
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

The Studio uses the KF development port:

~~~text
http://localhost:4700
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

Runtime smoke test:

~~~powershell
corepack pnpm test:runtime
~~~

Full local check with runtime smoke test:

~~~powershell
corepack pnpm check:runtime
~~~

`test:runtime` starts or reuses the local Studio through Playwright and resets the runtime workspace before each test through `/api/test/reset`. The reset route requires a local request and the `x-kf-test-reset-token` header.

Keep `test:runtime` separate from default `check` until KF has stronger package-state fixtures and database-backed reset safeguards for non-local environments.

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

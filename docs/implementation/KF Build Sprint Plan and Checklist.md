# Knowledge Factory Build Sprint Plan and Checklist

**Status:** Active planning baseline  
**Created:** 2026-07-14  
**Current phase:** Sprint 1 - Core Workspace and Source Management  
**Source baseline:** `docs/v1` Version 1.0 frozen architecture and `docs/v1/TRY 1`

---

## 1. Purpose

This document is the living sprint plan for building Knowledge Factory.

It converts the Version 1 architecture and TRY 1 roadmap into a practical implementation checklist. The team should update this document as work progresses so the repository always shows:

- what has been decided,
- what is in progress,
- what is complete,
- what remains blocked,
- what must be verified before moving forward.

---

## 2. Architecture Guardrails

All sprint work must preserve these rules from the frozen baseline:

- Knowledge Factory is a professional knowledge manufacturing platform.
- Knowledge Objects are the core unit.
- Professional Knowledge Assets are the primary governed output.
- AI assists manufacturing; humans govern approval.
- Sources, provenance, validation, review status, versioning, and audit history are mandatory design concerns.
- Knowledge Factory manufactures PKAs; LADOS or another runtime executes or hosts them.
- Knowledge Factory may later expose a Runtime Knowledge Service for approved knowledge, but it must not duplicate the LADOS runtime layer.
- A PKA is a package-level governed asset composed of smaller Knowledge Objects and Knowledge Asset Components.
- Base PKAs must be distinguished from client-adapted PKA instances and runtime vault state.
- Runtime apps must retrieve focused governed context from PKAs instead of sending whole PKAs, graphs, source libraries, or client vaults to AI models.
- AI providers must remain abstracted, including local Ollama-style deployment.
- Sensitive organizational knowledge must not be sent to external AI providers unless explicitly configured.

---

## 3. Working Definition of MVP

The MVP is successful when a user can:

1. Create a Knowledge Factory project.
2. Add professional source material.
3. Generate or manually create Knowledge Object candidates.
4. Link Knowledge Objects to source evidence.
5. Review and approve Knowledge Objects.
6. Build a simple relationship graph.
7. Ask grounded questions against approved knowledge.
8. Export a structured PKA package.
9. Validate the PKA package in a local LADOS-compatible test harness.

---

## 4. Sprint Update Rules

Use these status markers:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked
- `[?]` Needs decision

Every sprint update should include:

- date,
- changed checklist items,
- verification performed,
- blockers or decisions needed,
- documentation updated.

Do not mark a sprint complete until its acceptance checks are complete or explicitly deferred with a documented reason.

---

## 5. Sprint Roadmap

### Pre-Sprint Gate - Architecture Corrections

**Goal:** Resolve implementation-shaping decisions before scaffold work begins.

**Primary outcome:** Sprint 0 starts with explicit architecture choices instead of accidental defaults.

Checklist:

- [x] Complete pre-sprint architecture audit.
- [x] Confirm host strategy: LADOS pack/module-first or standalone-first with LADOS-compatible boundaries.
- [x] Confirm canonical MVP lifecycle states for Knowledge Objects, Missions, reviews, and PKAs.
- [x] Confirm minimal Mission model.
- [x] Confirm minimal organisation, workspace, project, identity, and role model.
- [x] Confirm AI provider/model router boundary, with Ollama as first local provider behind the boundary.
- [x] Confirm local database/storage strategy.
- [x] Initialize or repair Git repository state.
- [x] Update this sprint checklist after decisions are accepted.
- [x] Review shared CFO/LADOS architecture discussion and capture implementation implications.
- [x] Add PKA Anatomy and Runtime Boundary note after AIFA alignment review.

Acceptance checks:

- [x] Scaffold strategy does not conflict with the LADOS pack strategy in `KF 5_5`.
- [x] Mission Architecture is represented from the first implementation phase.
- [x] Governance lifecycle states are defined before schema work.
- [x] Version control works before code changes begin.

---

### Sprint 0 - Foundation and Technical Decisions

**Goal:** Establish the implementation foundation without violating the architecture baseline.

**Primary outcome:** The repository has a clear app scaffold, documented local stack, environment template, command list, and initial quality gates.

Checklist:

- [x] Confirm application framework and package manager after host strategy is decided.
- [x] Define LADOS-compatible module/pack boundaries even if the first scaffold runs as a local development shell.
- [x] Decide monorepo structure.
- [x] Decide initial backend/API approach.
- [x] Decide initial database strategy.
- [x] Decide source file storage strategy for local development.
- [x] Decide queue/worker strategy for early pipeline jobs.
- [x] Decide AI provider/model router interface and Ollama integration boundary.
- [x] Define minimal Mission model.
- [x] Define canonical MVP lifecycle states.
- [x] Define minimal local-first organisation/workspace/project/identity/role model.
- [x] Create initial source folders according to the approved structure.
- [x] Initialize or repair Git repository if not already valid.
- [x] Add root install command.
- [x] Add root dev command.
- [x] Add root build command.
- [x] Add root lint command.
- [x] Add root test command.
- [x] Add graph refresh command documentation.
- [x] Add `.env.example` without secrets.
- [x] Add local development README or setup section.
- [x] Add baseline code formatting/linting configuration.
- [x] Add initial CI/check script if practical.
- [x] Update `AGENTS.md` command list after commands exist.
- [x] Refresh Graphify after meaningful structure changes.
- [x] Capture PKA package/component and Runtime Knowledge Service planning implications.
- [x] Document Base PKA, client-adapted PKA instance, runtime vault, and runtime boundary vocabulary.

Acceptance checks:

- [x] A new developer can install dependencies.
- [x] A new developer can start the app locally.
- [x] A build or equivalent type check runs.
- [x] No secrets are committed.
- [x] Project structure matches the documented architecture.
- [x] KF uses its own database/container/volume and does not reuse another project's database.
- [ ] `git status` succeeds.

Key decisions to make:

- [x] LADOS pack/module-first vs standalone-first with LADOS-compatible boundaries.
- [x] Next.js full-stack app vs separate frontend/backend.
- [x] PostgreSQL now vs local lightweight persistence for first scaffold.
- [x] Docker Compose now vs app-first local mock services.
- [x] Use relational graph tables first vs introduce Neo4j later.
- [x] Single-user local identity stub vs full authentication in first scaffold.

---

### Sprint 1 - Core Workspace and Source Management

**Goal:** Build the first usable Studio workspace for projects and sources.

**Primary outcome:** Users can create/select a project, register source material, and inspect source metadata/status.

Checklist:

- [x] Create Studio shell with primary navigation.
- [x] Add Dashboard route.
- [x] Add Mission Centre route.
- [x] Add Projects data model.
- [x] Add Workspace data model or workspace field strategy.
- [x] Add minimal Organisation/Owner fields.
- [x] Add minimal Mission records for project/source actions where practical.
- [x] Add Projects list view.
- [x] Add Project detail/workspace context.
- [x] Add Sources data model.
- [x] Add Sources list view.
- [x] Add Source detail view.
- [x] Add manual source registration.
- [x] Add source metadata fields: title, type, owner, version, date added, domain, reliability, review status.
- [x] Add source licensing or usage policy metadata.
- [x] Add source category support for standards, SOPs, company documents, expert interviews, historical cases, analytical models, templates, and external data references.
- [x] Preserve source metadata needed to separate Base PKA inputs from client/runtime-local adaptation inputs.
- [x] Add Sprint 1 architecture track for PKA retrieval/context contracts.
- [x] Add `PkaContextBundle` and related retrieval context types to `packages/pka`.
- [x] Add retrieval capability fields to the `PkaManifest` contract.
- [x] Add app-developer context bundle examples for AIFA and LADOS.
- [x] Add local file upload or documented placeholder if deferred.
- [x] Store source file or artifact reference.
- [x] Track processing status.
- [x] Add recent activity entries for project/source actions.
- [x] Add basic dashboard metrics: source count, KO count, draft count, approved count, readiness placeholder.
- [x] Add project creation form.
- [x] Add source-to-project assignment during source registration.
- [x] Add lightweight store contract test for project/source creation and retrieval.
- [x] Add Mission Centre operational queue metrics.
- [x] Add manual Mission creation control.
- [x] Add Mission status update control.
- [x] Add automatic Mission traces for project creation and source registration.
- [x] Update docs for local usage and data model decisions.

Acceptance checks:

- [x] User can create a project.
- [x] User can register a source under a project.
- [~] Source metadata persists.
- [x] Dashboard reflects source/project counts.
- [x] UI is an operational control panel, not a landing page.
- [x] Mission Centre exists as the future operational heart of the Studio.

---

### Sprint 2 - Knowledge Object Repository MVP

**Goal:** Implement the first governed Knowledge Object workflow.

**Primary outcome:** Users can create, edit, search, filter, and inspect Knowledge Objects with source evidence.

Checklist:

- [ ] Add Knowledge Object data model.
- [ ] Decide which package components are Knowledge Objects and which need dedicated component records.
- [ ] Apply canonical MVP lifecycle states.
- [ ] Add KO fields: ID, type, title/name, description, domain, tags, status, version, confidence, approval status.
- [ ] Add owner, author, contributor, reviewer, and approval metadata where practical.
- [ ] Add source evidence link model.
- [ ] Add relationship model for simple KO-to-KO links.
- [ ] Add KO list view.
- [ ] Add KO filters by type, status, domain, and tag.
- [ ] Add KO search.
- [ ] Add KO detail view.
- [ ] Add source evidence panel.
- [ ] Add relationship panel.
- [ ] Add governance history placeholder or first audit log.
- [ ] Add manual KO creation.
- [ ] Add KO editing while draft or under review.
- [ ] Prevent direct editing of approved/published objects unless versioning behavior is defined.
- [ ] Add object status transitions: draft, under review, approved, deprecated.
- [ ] Add tests for KO CRUD, evidence links, and status rules.
- [ ] Update docs for KO schema and governance behavior.

Acceptance checks:

- [ ] Every KO can be traced to source evidence or marked as expert/manual input.
- [ ] KO status is visible.
- [ ] Approved knowledge is treated differently from draft knowledge.
- [ ] Search/filter supports practical repository browsing.

---

### Sprint 3 - Pipeline and AI-Assisted Drafting

**Goal:** Add the first Knowledge Manufacturing Pipeline loop.

**Primary outcome:** A source can move through ingestion/extraction/suggestion/review-ready draft generation.

Checklist:

- [ ] Add Mission-backed pipeline job model.
- [ ] Add pipeline stage tracking.
- [ ] Implement ingestion job for registered sources.
- [ ] Implement text extraction for at least Markdown/plain text.
- [ ] Add PDF extraction if feasible in this sprint.
- [ ] Add source chunking.
- [ ] Add AI provider/model router abstraction.
- [ ] Add Ollama provider adapter or documented local stub.
- [ ] Add KO suggestion output schema.
- [ ] Add relationship suggestion output schema.
- [ ] Add confidence and review notes to suggestions.
- [ ] Add Pipeline view with stage/status tracking.
- [ ] Add action to create draft KOs from suggestions.
- [ ] Add error states and retry behavior.
- [ ] Add tests for pipeline state transitions.
- [ ] Add tests for provider abstraction using a deterministic fake provider.
- [ ] Update docs for pipeline flow and AI provider configuration.

Acceptance checks:

- [ ] AI outputs remain draft.
- [ ] Suggested KOs preserve source references.
- [ ] Pipeline failures are visible and recoverable.
- [ ] Provider-specific details do not leak into application services.
- [ ] Pipeline work is traceable through Missions.

---

### Sprint 4 - Review, Governance, and Readiness Checks

**Goal:** Make human review and approval a first-class workflow.

**Primary outcome:** Reviewers can compare KOs against evidence, approve/reject/request changes, and see readiness gaps.

Checklist:

- [ ] Add Review queue.
- [ ] Add reviewer notes.
- [ ] Add approve/reject/request-changes actions.
- [ ] Add governance event log.
- [ ] Add version history model or first minimal version snapshots.
- [ ] Add readiness checks for missing source evidence.
- [ ] Add readiness checks for unapproved KOs.
- [ ] Add readiness checks for weak or missing relationships.
- [ ] Add readiness checks for missing required metadata.
- [ ] Add dashboard review metrics.
- [ ] Add tests for governance transitions.
- [ ] Add tests preventing release of unapproved required KOs.
- [ ] Update docs for review rules and readiness checks.

Acceptance checks:

- [ ] No PKA can be marked ready if required governance checks fail.
- [ ] Reviewer accountability is recorded.
- [ ] Evidence remains visible during review.
- [ ] AI suggestions are never treated as approved by default.

---

### Sprint 5 - Ontology, Graph, and Relationship Quality

**Goal:** Make relationships and domain structure inspectable.

**Primary outcome:** Users can manage basic ontology terms and inspect a useful relationship graph.

Checklist:

- [ ] Add ontology/category model.
- [ ] Add object type configuration or documented fixed MVP types.
- [ ] Add relationship type configuration or documented fixed MVP types.
- [ ] Add Ontology view.
- [ ] Add Graph view.
- [ ] Add node search.
- [ ] Add filters by object type.
- [ ] Add filters by relationship type.
- [ ] Add source-backed relationship indicator.
- [ ] Add isolated object detection.
- [ ] Add missing relationship warnings.
- [ ] Add tests for graph retrieval and relationship filtering.
- [ ] Update docs for ontology and graph implementation decisions.

Acceptance checks:

- [ ] Graph view supports quality control, not decoration.
- [ ] Relationships can be traced to source or review evidence.
- [ ] Isolated or weakly linked objects are visible.

---

### Sprint 6 - PKA Builder and Export

**Goal:** Export the first structured Professional Knowledge Asset.

**Primary outcome:** Approved Knowledge Objects can be assembled into an inspectable PKA archive or folder package.

Checklist:

- [ ] Add PKA package record model.
- [ ] Define PKA package/component vocabulary in implementation terms.
- [ ] Implement Base PKA vs client-adapted PKA instance distinction in package/export design.
- [ ] Add PKA Builder view.
- [ ] Select approved KOs for package.
- [ ] Include ontology.
- [ ] Include graph relationships.
- [ ] Include source reference index.
- [ ] Include prompt/instruction library placeholder.
- [ ] Include runtime configuration.
- [ ] Include package component index for rules, templates, formulas, cases, prompts, workflows, or KO collections where present.
- [ ] Include governance metadata.
- [ ] Include licensing and usage policy metadata.
- [ ] Generate `manifest.json`.
- [ ] Validate required manifest fields.
- [ ] Export package structure:
  - [ ] `manifest.json`
  - [ ] `ontology/`
  - [ ] `knowledge-objects/`
  - [ ] `graph/`
  - [ ] `sources/`
  - [ ] `prompts/`
  - [ ] `rules/`
  - [ ] `workflows/`
  - [ ] `templates/`
  - [ ] `runtime/`
  - [ ] `governance/`
- [ ] Add package validation report.
- [ ] Add incremental package update strategy notes.
- [ ] Document what is excluded from a Base PKA and belongs to runtime vault/client state.
- [ ] Add tests for manifest generation and validation.
- [ ] Update docs for PKA export format.

Acceptance checks:

- [ ] Exported PKA can be inspected without the app.
- [ ] Manifest declares runtime capability requirements.
- [ ] Package includes governance status and source traceability.
- [ ] Package preserves licensing and usage policy metadata.
- [ ] Unapproved required KOs cannot be released as approved.

---

### Sprint 7 - AI Workbench and Grounded Q&A

**Goal:** Prove retrieval-first intelligence over approved knowledge.

**Primary outcome:** Users can ask questions and inspect retrieved evidence, uncertainty, and source links.

Checklist:

- [ ] Add AI Workbench view.
- [ ] Add question input.
- [ ] Retrieve approved KOs.
- [ ] Retrieve source evidence.
- [ ] Retrieve related graph context.
- [x] Define first PKA context bundle shape for model-ready retrieval results.
- [ ] Generate grounded answer through provider abstraction.
- [ ] Show evidence used.
- [ ] Show uncertainty or unsupported-answer warning.
- [ ] Prevent unsupported draft knowledge from being presented as approved.
- [ ] Add prompt testing controls.
- [ ] Add provider/model selection for local development if configured.
- [ ] Add tests using fake provider and deterministic retrieval fixtures.
- [ ] Update docs for grounded Q&A behavior.

Acceptance checks:

- [ ] Answer includes evidence.
- [ ] Unsupported questions are handled honestly.
- [ ] Draft/unapproved knowledge is clearly labeled or excluded.
- [ ] Local AI path is available or explicitly stubbed with next steps.

---

### Sprint 8 - LADOS-Compatible Runtime Test Harness

**Goal:** Demonstrate that a PKA can be loaded by a compatible runtime harness.

**Primary outcome:** A local test harness validates and queries an exported PKA.

Checklist:

- [ ] Define minimal runtime import contract.
- [ ] Define future Runtime Knowledge Service contract shape for approved-knowledge queries.
- [ ] Define runtime vault boundary for local PKA packages, client adaptations, business records, AI memory, workflow state, and user preferences.
- [x] Define app-developer retrieval boundary: selected governed context only, not whole PKA or graph upload.
- [x] Document MCP-style retrieval tool examples for PKA context bundles.
- [ ] Build local PKA loader/test harness.
- [ ] Validate manifest.
- [ ] Load ontology.
- [ ] Load Knowledge Objects.
- [ ] Load relationships.
- [ ] Load prompts/runtime configuration.
- [ ] Report missing runtime capabilities.
- [ ] Run a grounded Q&A demo using package content.
- [ ] Demonstrate one workflow or assistant behavior.
- [ ] Verify unapproved knowledge is not loaded or served as production-ready knowledge.
- [ ] Add tests for valid and invalid package imports.
- [ ] Update docs for runtime contract.

Acceptance checks:

- [ ] Exported PKA loads outside the main authoring flow.
- [ ] Runtime capability mismatch is clear.
- [ ] Evidence-grounded answer demo works from package content.
- [ ] At least one workflow or assistant behavior is demonstrated.

---

### Sprint 9 - First Domain PKA Pilot

**Goal:** Build a small but complete first PKA using the system.

**Primary outcome:** A real domain pilot proves the core knowledge manufacturing loop.

Recommended pilot options:

- Construction claims.
- Civil engineering QA/QC.
- Internal SOP assistant.
- Quantity surveying knowledge assistant.

Checklist:

- [ ] Choose pilot domain.
- [ ] Define pilot scope.
- [ ] Register source materials.
- [ ] Create/extract KOs.
- [ ] Review and approve pilot KOs.
- [ ] Build relationships.
- [ ] Run readiness checks.
- [ ] Export PKA.
- [ ] Validate in runtime harness.
- [ ] Run demo scenario.
- [ ] Record gaps and next backlog.
- [ ] Update documentation with pilot lessons.

Acceptance checks:

- [ ] Pilot proves source-to-PKA lifecycle.
- [ ] Governance gaps are visible.
- [ ] Runtime demo is repeatable.
- [ ] Next backlog is based on observed product gaps.

---

## 6. Cross-Sprint Quality Checklist

Apply these checks to every sprint:

- [ ] Architecture invariants preserved.
- [ ] Documentation updated for changed behavior, commands, schemas, APIs, or operating rules.
- [ ] Tests added where practical.
- [ ] Error states handled.
- [ ] Governance impact reviewed.
- [ ] Source evidence and provenance preserved.
- [ ] No secrets committed or printed.
- [ ] No unnecessary production dependencies added without approval.
- [ ] Graphify refreshed after meaningful code structure changes.

---

## 7. Initial Backlog by Capability

### Studio

- [ ] Dashboard
- [ ] Mission Centre
- [ ] Sources
- [ ] Knowledge Objects
- [ ] Ontology
- [ ] Graph
- [ ] Pipeline
- [ ] Review
- [ ] PKA Builder
- [ ] AI Workbench
- [ ] Settings

### Services

- [ ] Mission Service
- [ ] Project Service
- [ ] Source Service
- [ ] Knowledge Object Service
- [ ] Ontology Service
- [ ] Graph Service
- [ ] Pipeline Orchestration Service
- [ ] Review Service
- [ ] PKA Packaging Service
- [ ] AI Provider Service
- [ ] Runtime Integration Service
- [ ] Runtime Knowledge Service boundary
- [ ] PKA Anatomy and Runtime Boundary
- [ ] PKA Retrieval and Context Engine

### Data

- [ ] Projects
- [ ] Workspaces
- [ ] Minimal organisations/owners
- [ ] Missions
- [ ] Sources
- [ ] Source artifacts/chunks
- [ ] Knowledge Objects
- [ ] Relationships
- [ ] Reviews
- [ ] Versions
- [ ] Audit logs
- [ ] Mission-backed pipeline jobs
- [ ] PKA packages
- [ ] PKA component manifest entries
- [ ] Client-adapted PKA instance records
- [ ] PKA context bundle records or fixtures
- [ ] Provider settings without secrets

### Local Infrastructure

- [ ] Web app
- [ ] Backend/API
- [ ] Worker
- [ ] Database
- [ ] Object/file storage
- [ ] Queue
- [ ] Vector search
- [ ] Graph exploration layer
- [ ] Ollama provider
- [ ] PKA export folder/archive

---

## 8. Decision Log

| Date | Decision | Status | Notes |
| --- | --- | --- | --- |
| 2026-07-14 | Begin building Knowledge Factory from Phase 0 and Phase 1 | Accepted | Based on Volume J immediate next step. |
| 2026-07-14 | Maintain this sprint plan as a living checklist | Accepted | Update as implementation progresses. |
| 2026-07-14 | Add pre-sprint architecture correction gate | Accepted | Required after full architecture audit before Sprint 0. |
| 2026-07-14 | Host strategy is standalone-first with LADOS-compatible boundaries | Accepted | Keep package/module boundaries suitable for later LADOS integration. |
| 2026-07-14 | Use Next.js App Router with TypeScript for Studio | Accepted | Build as standalone-first Studio app. |
| 2026-07-14 | Use pnpm via Corepack | Accepted | Supports the planned workspace monorepo. |
| 2026-07-14 | Use pnpm workspace monorepo layout | Accepted | Initial layout: `apps/studio`, `packages/core`, `packages/db`, `packages/ai`, `packages/pka`, `packages/ui`, `packages/config`; worker package later. |
| 2026-07-14 | Use PostgreSQL with Prisma from Sprint 0 | Accepted | No hosted Supabase project required for Sprint 0; use a dedicated KF database/container. |
| 2026-07-14 | Add Docker Compose in Sprint 0 for infrastructure only | Accepted | Start with PostgreSQL; add Redis/MinIO later when needed. |
| 2026-07-14 | Use local filesystem storage behind `StorageProvider` first | Accepted | Preserve path to MinIO/object storage later. |
| 2026-07-14 | Use relational graph tables first | Accepted | Defer Neo4j; relationships include typed edges, provenance, confidence, and status. |
| 2026-07-14 | Use canonical MVP lifecycle states | Accepted | `draft`, `ai_generated`, `under_review`, `changes_requested`, `expert_validated`, `approved`, `published`, `deprecated`, `archived`, `rejected`. |
| 2026-07-14 | Use minimal Mission model from the first schema | Accepted | Every meaningful action should be traceable as a Mission or Mission-backed activity. |
| 2026-07-14 | Use single local org/workspace with seeded roles first | Accepted | Keep ownership, reviewer, publisher, and audit fields in schema. |
| 2026-07-14 | Use provider/model-router boundary first | Accepted | Add deterministic fake provider in Sprint 0; Ollama adapter in Sprint 3. |
| 2026-07-14 | First pilot is QS/RFQ from BOQ PKA | Accepted | Simple proof of concept for Quantity Surveying / Request for Quotation from Bill of Quantity. |
| 2026-07-14 | Git repository initialized and KF remote attached | Accepted | Remote: `https://github.com/EffortEdutech/KF`. |
| 2026-07-14 | Sprint 0 foundation decisions finalized | Accepted | Implementation tasks remain open: scaffold, commands, Docker Compose, env template, and docs. |
| 2026-07-14 | Sprint 0 scaffold created | Accepted | Added Next.js Studio app, pnpm workspace packages, Prisma schema, dedicated PostgreSQL Compose service, env example, setup docs, and command list. |
| 2026-07-14 | Docker CLI unavailable in current shell | Blocked | `docker compose config` could not run because `docker` is not on PATH. Compose file still added for KF. |
| 2026-07-14 | Sprint 0 verification passed | Accepted | `corepack pnpm install`, `corepack pnpm check`, `corepack pnpm db:generate`, HTTP smoke test, and Graphify code refresh completed. |
| 2026-07-14 | Shared CFO/LADOS discussion reviewed | Accepted | Adds planning emphasis for two KF modes: Factory Mode and future Runtime Knowledge Service. Also clarifies PKA as a package-level asset composed of smaller governed components. |
| 2026-07-15 | PKA Anatomy and Runtime Boundary added | Accepted | Clarifies Base PKA vs client-adapted PKA instance, Local PKA Vault boundary, runtime ownership, and AIFA/LADOS alignment. |
| 2026-07-15 | Sprint 1 started with visible Studio routes | Accepted | Added Dashboard, Mission Centre, Projects, and Sources routes using typed local seed data before persistence. |
| 2026-07-15 | Source registration uses local session storage first | Accepted | Server Action creates source records in local session storage until Docker/Postgres verification is available. Prisma remains the persistence contract. |
| 2026-07-15 | PKA retrieval/context engine developer guidance added | Accepted | Apps should retrieve selected governed context from PKAs and send only that context to AI models. This mirrors local Graphify/Codex retrieval and supports MCP-style tools. |
| 2026-07-15 | PKA context bundle contract added early in Sprint 1 | Accepted | `packages/pka` now exports retrieval capability, governance mode, and context bundle types. The manifest declares retrieval capabilities and context bundle schema version. |
| 2026-07-15 | Sprint 1 project/source workspace store added | Accepted | Projects and sources now share an in-memory workspace store with project creation, source-to-project assignment, and a lightweight TypeScript store contract test. |
| 2026-07-15 | Sprint 1 Mission Centre controls added | Accepted | Mission Centre now has queue metrics, manual Mission creation, status updates, and automatic Mission traces for project/source creation. |

---

## 9. Open Decisions

- [x] Application framework: Next.js App Router with TypeScript.
- [x] Package manager: pnpm via Corepack.
- [x] Host strategy: standalone-first with LADOS-compatible boundaries.
- [x] Monorepo layout: pnpm workspace with `apps/studio`, `packages/core`, `packages/db`, `packages/ai`, `packages/pka`, `packages/ui`, `packages/config`; worker package later.
- [x] Database setup timing: PostgreSQL + Prisma from Sprint 0, using a dedicated KF database/container.
- [x] Docker Compose timing: Sprint 0 for infrastructure only, starting with PostgreSQL.
- [x] Initial file storage implementation: local filesystem behind `StorageProvider`.
- [x] Initial graph implementation: relational graph tables first; defer Neo4j.
- [x] Canonical MVP lifecycle states: `draft`, `ai_generated`, `under_review`, `changes_requested`, `expert_validated`, `approved`, `published`, `deprecated`, `archived`, `rejected`.
- [x] Minimal Mission model: Mission-backed traceability for meaningful project, source, pipeline, review, and packaging activity.
- [x] Minimal organisation/workspace/project/identity/role model: single local org/workspace with seeded roles and ownership fields.
- [x] First local AI integration depth behind provider/model router: deterministic fake provider in Sprint 0, Ollama adapter in Sprint 3.
- [x] First pilot domain for Sprint 9: Quantity Surveying / RFQ from BOQ PKA proof of concept.
- [x] PKA anatomy and runtime boundary: Base PKA is manufactured by KF; runtime products own client data, runtime state, and client-adapted PKA instances.
- [x] App developer retrieval posture: cloud AI receives selected governed context, not whole PKAs, graphs, source libraries, or client vaults.
- [x] Initial PKA context bundle contract: exported from `packages/pka` with AIFA and LADOS examples documented.

---

## 10. Current Next Actions

1. Verify Docker Compose once Docker CLI is available.
2. Add a small source/project detail navigation pattern or scoped filtering.
3. Move project/source/mission mutations from local session storage to Prisma once Docker/Postgres is verified.
4. Add stronger runtime tests once a test runner is approved or introduced.

---

**End of Sprint Plan**

# Knowledge Factory Build Sprint Plan and Checklist

**Status:** Active planning baseline  
**Created:** 2026-07-14  
**Current phase:** Sprint 3 - Pipeline and AI-Assisted Drafting
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
- [x] Add URL-based Project detail selection.
- [x] Add Sources data model.
- [x] Add Sources list view.
- [x] Add Source detail view.
- [x] Add URL-based Source detail selection and project-scoped source filtering.
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
- [x] Move project/source/mission reads and mutations to Prisma when `DATABASE_URL` is configured.
- [x] Add stronger project/source/mission empty and missing-selection states.
- [x] Add first project/source readiness hints for source intake, governance review, usage policy, and Sprint 2 KO preparation.
- [x] Add Knowledge Objects repository preparation route as the Sprint 2 entry surface.
- [x] Update docs for local usage and data model decisions.

Acceptance checks:

- [x] User can create a project.
- [x] User can register a source under a project.
- [x] Source metadata persists.
- [x] Dashboard reflects source/project counts.
- [x] UI is an operational control panel, not a landing page.
- [x] Mission Centre exists as the future operational heart of the Studio.

---

### Sprint 2 - Knowledge Object Repository MVP

**Goal:** Implement the first governed Knowledge Object workflow.

**Primary outcome:** Users can create, edit, search, filter, and inspect Knowledge Objects with source evidence.

Checklist:

- [x] Add Knowledge Object data model.
- [x] Decide which package components are Knowledge Objects and which need dedicated component records.
- [x] Apply canonical MVP lifecycle states.
- [x] Add KO fields: ID, type, title/name, description, domain, tags, status, version, confidence, approval status.
- [x] Add owner, author, contributor, reviewer, and approval metadata where practical.
- [x] Add source evidence link model.
- [x] Add relationship model for simple KO-to-KO links.
- [x] Add KO list view.
- [~] Add KO filters by type, status, domain, and tag.
- [x] Add KO search.
- [x] Add KO detail view.
- [x] Add source evidence panel.
- [x] Add relationship panel.
- [x] Add first relationship quality/readiness hints.
- [x] Add governance history placeholder or first audit log.
- [x] Add relationship filtering controls by relationship type and quality state.
- [x] Add first audit-backed version snapshot placeholder for edited KOs.
- [x] Add manual KO creation.
- [x] Add KO editing while draft or under review.
- [x] Prevent direct editing of approved/published objects unless versioning behavior is defined.
- [x] Add object status transitions: draft, under review, approved, deprecated.
- [~] Add tests for KO CRUD, evidence links, status rules, version snapshots, and relationship filters.
- [x] Update docs for KO schema and governance behavior.

Acceptance checks:

- [x] Every KO can be traced to source evidence or marked as expert/manual input.
- [x] KO status is visible.
- [x] Approved knowledge is treated differently from draft knowledge.
- [x] Search/filter supports practical repository browsing.

---

### Sprint 3 - Pipeline and AI-Assisted Drafting

**Goal:** Add the first Knowledge Manufacturing Pipeline loop.

**Primary outcome:** A source can move through ingestion/extraction/suggestion/review-ready draft generation.

Checklist:

- [x] Add Mission-backed pipeline job model.
- [x] Add pipeline stage tracking.
- [x] Implement ingestion job for registered sources.
- [x] Implement deterministic text extraction placeholder for registered sources.
- [x] Implement Markdown/plain-text extraction from stored source artifacts.
- [ ] Add PDF extraction if feasible in this sprint.
- [x] Add source chunking.
- [x] Add AI provider/model router abstraction.
- [x] Add deterministic local fake provider stub.
- [x] Add KO suggestion output schema.
- [x] Add relationship suggestion output schema.
- [x] Add confidence and review notes to suggestions.
- [x] Add Pipeline view with stage/status tracking.
- [x] Add action to create draft KOs from suggestions.
- [x] Add visible retry behavior and failed pipeline job surfacing.
- [x] Add relationship suggestion reject/defer controls.
- [x] Add KO suggestion reject/defer controls.
- [x] Add explicit failed-ingestion fixture for runtime recovery tests.
- [x] Add deterministic pipeline quality metrics for chunks, suggestions, decision ratios, failures, and retries.
- [x] Add pipeline metrics drilldowns by source and status.
- [x] Add source-ingestion fixture coverage for unsupported file types and empty artifact content.
- [x] Add runtime verification for persisted package governance exports.
- [x] Add pipeline audit/history panel per source.
- [x] Add deterministic source artifact repair flow after unsupported/empty fixture failure.
- [x] Add ZIP/archive-level governance export verification.
- [x] Add pipeline run detail drawer for longer source histories.
- [x] Add user-provided artifact repair text/path behind safe storage rules.
- [x] Add package archive/ZIP import-readback validation.
- [x] Add visible package import/readback report page for persisted package files.
- [x] Add invalid archive/ZIP readback fixtures.
- [x] Add runtime import/readback contract harness for selected persisted packages.
- [x] Add deterministic runtime import fixtures for valid, missing-governance, malformed-archive, and capability-mismatch cases.
- [x] Add ontology and runtime placeholder component checks to the runtime import harness.
- [x] Add safe local JSON archive import handling under `storage/exports/<packageId>/imports/`.
- [x] Add prompt, rule, workflow, and template placeholder checks to the runtime import harness.
- [x] Add runtime import decision history/audit trail.
- [x] Add package installer contract document for AIFA/LADOS developers.
- [x] Add runtime import decision filtering and drilldowns by importable vs blocked.
- [x] Add missing-component fixtures for prompt, rule, workflow, and template component indexes.
- [x] Add Ollama adapter design notes without implementation.
- [x] Add tests for pipeline state transitions.
- [x] Add tests for provider abstraction using a deterministic fake provider.
- [x] Update docs for pipeline flow and AI provider configuration.

Acceptance checks:

- [x] AI outputs remain draft.
- [x] Suggested KOs preserve source references.
- [x] Pipeline failures are visible and recoverable.
- [x] Pipeline quality metrics are visible in Studio.
- [x] Provider-specific details do not leak into application services.
- [x] Pipeline work is traceable through Missions.

---

### Sprint 4 - Review, Governance, and Readiness Checks

**Goal:** Make human review and approval a first-class workflow.

**Primary outcome:** Reviewers can compare KOs against evidence, approve/reject/request changes, and see readiness gaps.

Checklist:

- [x] Add Review queue.
- [x] Add reviewer notes.
- [x] Add approve/reject/request-changes actions.
- [~] Add governance event log.
- [x] Add version history model or first minimal version snapshots.
- [x] Add readiness checks for missing source evidence.
- [x] Add readiness checks for unapproved KOs.
- [x] Add readiness checks for weak or missing relationships.
- [x] Add readiness checks for missing required metadata.
- [x] Add dashboard review metrics.
- [~] Add tests for governance transitions.
- [x] Add tests preventing release of unapproved required KOs.
- [x] Update docs for review rules and readiness checks.
- [x] Add Review route filtering for decision history and reviewer ownership.
- [x] Add dashboard drilldowns into filtered Review views.
- [x] Add PKA Builder release-blocking integration.
- [x] Decide when `test:runtime` joins default `pnpm check`.
- [x] Add Review route filtering by queue status and blocker type.
- [x] Add dashboard links/drilldowns from release blockers to KO-specific review issues.
- [x] Add KO-specific release blocker remediation actions from Review.
- [x] Add deterministic runtime-test server orchestration and database reset/seed.
- [x] Add deeper browser coverage for actual review decisions and PKA Builder filtered drilldowns.

Acceptance checks:

- [x] No PKA can be marked ready if required governance checks fail.
- [x] Reviewer accountability is recorded.
- [x] Evidence remains visible during review.
- [ ] AI suggestions are never treated as approved by default.

---

### Sprint 5 - Ontology, Graph, and Relationship Quality

**Goal:** Make relationships and domain structure inspectable.

**Primary outcome:** Users can manage basic ontology terms and inspect a useful relationship graph.

Checklist:

- [ ] Add ontology/category model.
- [x] Add object type configuration or documented fixed MVP types.
- [x] Add relationship type configuration or documented fixed MVP types.
- [x] Add Ontology view.
- [x] Add Graph view.
- [x] Add node search.
- [x] Add filters by object type.
- [x] Add filters by relationship type.
- [x] Add source-backed relationship indicator.
- [x] Add relationship source-evidence attachment beyond provenance notes.
- [x] Add adjacency map for graph inspection.
- [x] Add isolated object detection.
- [x] Add missing relationship warnings.
- [x] Add relationship provenance detail.
- [x] Add relationship-level review/governance history.
- [~] Add tests for graph retrieval and relationship filtering.
- [x] Update docs for ontology and graph implementation decisions.

Acceptance checks:

- [x] Graph view supports quality control, not decoration.
- [x] Relationships can be traced to source or review evidence.
- [x] Isolated or weakly linked objects are visible.

---

### Sprint 6 - PKA Builder and Export

**Goal:** Export the first structured Professional Knowledge Asset.

**Primary outcome:** Approved Knowledge Objects can be assembled into an inspectable PKA archive or folder package.

Checklist:

- [~] Add PKA package record model.
- [x] Define PKA package/component vocabulary in implementation terms.
- [ ] Implement Base PKA vs client-adapted PKA instance distinction in package/export design.
- [~] Add PKA Builder view.
- [~] Select approved KOs for package.
- [~] Include ontology.
- [~] Include graph relationships.
- [~] Include source reference index.
- [x] Include prompt/instruction library placeholder.
- [x] Include runtime configuration placeholder.
- [x] Include package component index for rules, templates, prompts, workflows, formulas, cases, and runtime config placeholders.
- [x] Include governance metadata.
- [x] Include licensing and usage policy metadata.
- [~] Generate `manifest.json`.
- [x] Add manifest JSON export/inspection view.
- [x] Validate required manifest fields.
- [~] Export package structure:
  - [x] `manifest.json`
  - [x] `ontology/`
  - [x] `knowledge-objects/`
  - [x] `graph/`
  - [x] `sources/`
  - [x] `prompts/`
- [x] `rules/`
- [x] `formulas/`
- [x] `cases/`
- [x] `workflows/`
  - [x] `templates/`
  - [x] `runtime/`
  - [x] `governance/`
- [x] Add package validation report.
- [x] Add manifest detail preview.
- [x] Add package validation fixtures for invalid manifests.
- [x] Persist export preview as JSON files under `storage/exports/<packageId>`.
- [x] Add JSON archive download support.
- [x] Add true ZIP archive generation and download support.
- [x] Add formula and case-library component placeholders.
- [x] Add incremental package update strategy notes.
- [x] Add package replacement confirmation before overwriting the same version.
- [x] Add package diff summary between current and previous export files.
- [x] Add release/published semantics for immutable package exports.
- [x] Add package version lineage fields for replacement sequencing and previous package IDs.
- [x] Add package release approval workflow separate from draft assembly.
- [x] Add package release rejection/request-changes actions.
- [x] Add reviewer/publisher notes and audit history for package release decisions.
- [x] Add package release gate UI in PKA Builder.
- [x] Add release decision summaries to exported `governance/index.json`.
- [x] Add package version lineage visualization.
- [x] Add published export retention policy surface.
- [x] Decide relationship source evidence remains in structured provenance for the pilot.
- [x] Document what is excluded from a Base PKA and belongs to runtime vault/client state.
- [x] Add tests for manifest generation and validation.
- [x] Add runtime/browser coverage proving draft assembly is separate from release approval and publish.
- [x] Add runtime/browser coverage for persisted package readback and invalid readback fixtures.
- [~] Update docs for PKA export format.

Acceptance checks:

- [x] Exported PKA can be inspected without the app.
- [x] Manifest declares runtime capability requirements.
- [x] Package includes governance status and source traceability.
- [x] Package preserves licensing and usage policy metadata.
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

- [x] Define minimal runtime import contract.
- [ ] Define future Runtime Knowledge Service contract shape for approved-knowledge queries.
- [ ] Define runtime vault boundary for local PKA packages, client adaptations, business records, AI memory, workflow state, and user preferences.
- [x] Define app-developer retrieval boundary: selected governed context only, not whole PKA or graph upload.
- [x] Document MCP-style retrieval tool examples for PKA context bundles.
- [~] Build local PKA loader/test harness.
- [x] Validate manifest.
- [x] Load ontology.
- [x] Load Knowledge Objects.
- [x] Load relationships.
- [x] Load prompts/runtime configuration.
- [x] Check rule, workflow, and template placeholder component boundaries.
- [x] Report missing runtime capabilities.
- [ ] Run a grounded Q&A demo using package content.
- [ ] Demonstrate one workflow or assistant behavior.
- [ ] Verify unapproved knowledge is not loaded or served as production-ready knowledge.
- [x] Add tests for valid and invalid package imports.
- [ ] Update docs for runtime contract.

Acceptance checks:

- [ ] Exported PKA loads outside the main authoring flow.
- [x] Runtime capability mismatch is clear.
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
| 2026-07-15 | Sprint 1 project/source scoped navigation added | Accepted | Projects support URL-selected detail views; Sources support project-scoped filters and URL-selected source details. |
| 2026-07-15 | Docker/Postgres verification completed | Accepted | Docker Desktop CLI was resolved through `scripts/docker-compose.ps1`; `kf-postgres` is healthy on `55432`. |
| 2026-07-15 | Initial Prisma migration applied | Accepted | Migration `20260715094912_init` was created/applied and `prisma migrate status` reports the KF database schema is up to date. |
| 2026-07-15 | Project/source/mission mutations moved to Prisma | Accepted | Studio workspace service uses Prisma when `DATABASE_URL` is configured, with an in-memory fallback for environments without database configuration. Browser verified DB-backed project/source creation and automatic Mission traces. |
| 2026-07-15 | Sprint 1 hardening and Sprint 2 runway added | Accepted | Projects, Sources, and Mission Centre now expose empty/error states. Project/source readiness hints flag missing source intake, pending governance review, usage policy gaps, client-adaptation boundaries, and missing Knowledge Objects. `/knowledge-objects` now exists as the Sprint 2 preparation route. |
| 2026-07-15 | Sprint 2 Knowledge Object repository started | Accepted | The initial Prisma migration already contains `KnowledgeObject` and `SourceEvidence`; `prisma migrate status` confirms the database is up to date. Studio now supports first draft KO creation, list/detail/search/filter, source evidence display, and Mission tracing for manual KO creation. |
| 2026-07-16 | Sprint 2 KO governance and relationship slice added | Accepted | Draft and under-review KOs can now be edited, approved/deprecated KOs are locked from direct editing, lifecycle controls support draft/under_review/approved/deprecated, and a first KO-to-KO relationship creation/list panel is available. |
| 2026-07-16 | PKA component boundary decided | Accepted | Professional meaning stays in Knowledge Objects. Execution/loading/export/audit-specific structures use dedicated records such as source evidence, graph edges, ontology terms, workflow definitions, templates, formulas, prompts, runtime config, package manifests, and governance events. |
| 2026-07-16 | First KO governance audit history added | Accepted | KO edits, lifecycle transitions, and relationship creation now write governance/audit events and display selected-KO history in the Studio. Relationship quality hints flag isolated KOs, draft edges, weak confidence, and missing provenance. |
| 2026-07-16 | Sprint 2 relationship filters and version snapshots added | Accepted | `/knowledge-objects` can filter selected KO relationships by edge type and quality state. Editable KO saves now capture an audit-backed previous-version snapshot and bump the patch version. A Sprint 4 review queue preview and planning doc define the next governance boundary without adding a browser test dependency yet. |
| 2026-07-16 | Sprint 4 governance route and version table started | Accepted | Playwright is approved as the future browser/runtime test runner, pending package install and script wiring. `/review` is now the dedicated governance queue. Reviewer notes plus approved/changes_requested/rejected decisions write Review records, audit events, lifecycle updates, and Mission traces. KO snapshots are promoted to a dedicated `KnowledgeObjectVersion` table. |
| 2026-07-16 | Sprint 4 readiness and runtime smoke checks added | Accepted | `@playwright/test` is installed with `corepack pnpm test:runtime`. Dashboard and Review now show review metrics and PKA release-blocking checks for missing evidence, unapproved KOs, weak/missing relationships, and missing metadata. Store tests cover governance blockers. |
| 2026-07-16 | Review filters and PKA Builder release gate added | Accepted | `/review` now filters review history by decision and reviewer. Dashboard metrics drill into filtered Review and PKA Builder views. `/pka-builder` exists as a future packaging surface with release-blocking governance integration. `test:runtime` remains separate from default `check` until deterministic server orchestration and database reset/seed behavior are available; use `corepack pnpm check:runtime` for the full local gate. |
| 2026-07-16 | Review queue and blocker filters added | Accepted | `/review` now supports `queueStatus` and `blockerType` filters. Dashboard release-blocking checks and `/pka-builder` readiness items link into KO-specific Review views when a blocker belongs to a Knowledge Object. |
| 2026-07-16 | Continue Sprint 4 hardening before Sprint 5 | Accepted | Finish Review remediation, deterministic runtime reset/server orchestration, and deeper browser coverage before starting Sprint 5 ontology/graph quality. This keeps the governance foundation stable before graph-facing UX grows. |
| 2026-07-16 | Sprint 5 graph quality surface started | Accepted | `/ontology` is the first graph quality surface. It uses fixed MVP object/relationship vocabulary, object-type and relationship-type filters, isolated-KO detection, weak-edge counts, and KO-level graph readiness hints. |
| 2026-07-16 | Inline remediation and draft PKA assembly added | Accepted | Review can attach missing evidence and repair relationship provenance inline. PKA Builder can create a draft package record with manifest metadata only after release blockers clear. Runtime reset now requires a local request and reset token. |
| 2026-07-16 | Ontology search and package validation preview added | Accepted | `/ontology` now supports node search and relationship detail/history. PKA Builder now shows a package validation report and manifest detail preview. Runtime browser tests cover evidence/provenance remediation and draft package assembly. |
| 2026-07-16 | Relationship evidence and manifest JSON inspection added | Accepted | Relationship source evidence is stored as structured relationship provenance for now, with audit history and Review remediation. `/ontology` shows relationship evidence and an adjacency map. `/pka-builder/manifest` exposes the current package manifest JSON for local inspection/export while full folder/archive export remains Sprint 6 work. |
| 2026-07-16 | Sprint 6 export preview and runtime teardown hardening added | Accepted | Playwright runtime tests use `scripts/run-runtime-tests.mjs` and `scripts/runtime-studio-server.mjs` so the dev-server process tree exits cleanly on Windows. PKA Builder exposes an export preview for `manifest.json`, `ontology/`, `knowledge-objects/`, `graph/`, `sources/`, `governance/`, and placeholder component indexes for `runtime/`, `prompts/`, `rules/`, `formulas`, `cases`, `workflows/`, and `templates/`. |
| 2026-07-16 | PKA export files and JSON archive added | Accepted | Draft package assembly persists export preview files under `storage/exports/<packageId>`. `/pka-builder/download` can download individual JSON package files or the `package-archive.json` bundle. Relationship source evidence remains in structured provenance until Sprint 6 package/export feedback justifies a dedicated table. |
| 2026-07-16 | Persisted export detail, ZIP archive, and Base PKA boundary added | Accepted | `/pka-builder/export` inspects files persisted under `storage/exports/<packageId>`. `package.zip` is generated without new dependencies for pilot handoff. `docs/implementation/PKA Export Strategy.md` documents replace-by-version export updates, Base PKA exclusions, and the deferred relationship evidence table decision. |
| 2026-07-16 | Package replacement and immutable publish semantics added | Accepted | Same-version package assembly now requires explicit replacement confirmation and increments a replacement sequence. Published package versions are immutable; users must create a new version instead. PKA Builder shows file-level and semantic package diff status before assembly. |
| 2026-07-16 | Return to Sprint 3 after Sprint 6 hardening | Accepted | Sprint 3 was deferred intentionally until KO governance, Review gates, graph quality, and PKA export boundaries were stable. After package replacement, lineage, and immutable publish semantics, the next major track should return to Sprint 3 with a bounded ingestion-to-suggestion pipeline slice. |
| 2026-07-16 | Sprint 3 deterministic pipeline loop started | Accepted | Added `SourceChunk` and `KnowledgeSuggestion` records, Mission-backed source ingestion, deterministic fake-provider KO suggestions, `/pipeline` stage tracking, and suggestion-to-AI-generated-draft KO creation with source evidence. |
| 2026-07-16 | Sprint 3 relationship suggestions and artifact extraction added | Accepted | Added `RelationshipSuggestion` records, deterministic relationship fixtures, relationship-suggestion acceptance into draft graph edges, retry controls, failed job visibility, and Markdown/plain-text artifact extraction. |
| 2026-07-16 | Defer Ollama adapter until deterministic review flow is stronger | Accepted | Keep fake-provider fixtures as the Sprint 3 default while relationship suggestions, retry behavior, and review governance are hardened. Add Ollama after the deterministic pipeline can be reviewed reliably end to end. |
| 2026-07-17 | Sprint 3 suggestion governance hardening added | Accepted | Relationship suggestions can now be accepted, deferred, or rejected with audit history. Pipeline includes an explicit failed-ingestion fixture for recovery tests. Continue package release approval workflow before Ollama adapter work. |
| 2026-07-17 | Package release approval workflow added | Accepted | Draft package assembly is now separate from release approval. PKA packages move through `draft`, `under_review`, `approved`, and `published`; reviewer and publisher notes create audit history. PKA Builder shows release gate state, decision history, version lineage, and published export retention. Runtime tests prove publish requires approval. Ollama remains deferred until deterministic pipeline and package release governance are stable. |
| 2026-07-17 | Package non-approval and governance export summaries added | Accepted | PKA package release review now supports `changes_requested` and `rejected` decisions. `changes_requested` packages can be resubmitted; rejected packages require replacement or a new version before another release attempt. Exported `governance/index.json` now includes `releaseDecisionSummary`. Relationship source evidence remains in structured relationship provenance for the pilot; defer a dedicated table until multiple evidence links, independent review lifecycle, or evidence versioning is required. |
| 2026-07-17 | Sprint 3 deterministic pipeline metrics and failure fixtures added | Accepted | `/pipeline` now shows deterministic quality metrics for source chunks, suggestion decision ratios, failed jobs, and retries. Unsupported artifact and empty artifact fixtures create safe local test files and fail ingestion without falling back silently to metadata. PKA release decisions now refresh persisted package exports so `governance/index.json`, `package-archive.json`, and `package.zip` carry current release summaries after review/publish actions. Ollama remains deferred. |
| 2026-07-17 | Pipeline drilldowns and KO suggestion decisions added | Accepted | Pipeline metric cards and queue summaries now link into source/status filtered suggestion views. KO suggestions can be deferred or rejected with reviewer notes and audit history, matching relationship suggestion governance. Runtime browser tests verify persisted package governance exports contain release decision summaries after publication. Ollama remains deferred until deterministic pipeline and package governance stay stable end to end. |
| 2026-07-17 | Pipeline source history, artifact repair, and archive verification added | Accepted | `/pipeline` now shows source-level pipeline audit history for ingestion, retry, fixture, repair, and suggestion events. Failed unsupported/empty artifacts can be repaired into deterministic text fixtures and re-ingested. Store and runtime tests verify release summaries inside `governance/index.json`, `package-archive.json`, and `package.zip`. Ollama remains deferred. |
| 2026-07-17 | Pipeline event drawer and package readback validation added | Accepted | Source pipeline history now supports a longer event drawer. Artifact repair accepts inline replacement text or a safe workspace `.md`/`.txt` path; `.env`, unsupported extensions, empty files, and paths outside the workspace are rejected. Package validation now includes JSON archive and ZIP readback checks for governance release summaries. Ollama remains deferred. |
| 2026-07-17 | Visible package readback report and invalid fixtures added | Accepted | `/pka-builder/readback` shows persisted archive and ZIP readback status for assembled packages. Invalid archive and ZIP fixtures can be generated to prove missing governance summaries are caught before runtime import. Turbopack tracing was narrowed around server-side path resolution; if the warning remains after verification, isolate filesystem helpers into a dedicated server-only storage module next. |
| 2026-07-17 | Runtime import contract harness added | Accepted | `/runtime-import` simulates a LADOS-compatible runtime import against selected persisted PKA package archives. Deterministic fixtures cover valid package import, missing governance summary, malformed archive, and unsupported runtime capability mismatch. Ollama remains deferred until this deterministic import path is stable. |
| 2026-07-17 | Runtime import component and safe archive import checks added | Accepted | `/runtime-import` now checks ontology loading and the `runtime/config.json` placeholder boundary. Local uploaded/imported JSON archives are stored under `storage/exports/<packageId>/imports/` with filename sanitizing, JSON archive validation, and a 1 MB local harness limit. AIFA/LADOS docs now describe capability mismatch behavior. Ollama remains deferred. |
| 2026-07-17 | Runtime installer contract and import audit trail added | Accepted | `/runtime-import` now checks prompt, rule, workflow, and template placeholder boundaries and records `runtime_import.importable` or `runtime_import.blocked` decisions into governance history. `docs/implementation/PKA Package Installer Contract for Runtime Apps.md` defines deterministic installer expectations for AIFA/LADOS. Ollama remains deferred. |
| 2026-07-17 | Runtime import decision drilldowns and missing-component fixtures added | Accepted | `/runtime-import` now filters decision history by all/importable/blocked and shows import decision drilldown metrics. Deterministic fixtures now cover missing `prompts/`, `rules/`, `workflows/`, and `templates/` component indexes. `docs/implementation/Ollama Adapter Design Notes.md` records the future Ollama adapter boundary without implementing it. |

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
- [x] Browser/runtime test runner direction: Playwright is approved for KF, but package installation and `pnpm check` wiring remain a separate tooling task.
- [x] Knowledge Object version persistence: promote from audit-backed placeholders to dedicated `KnowledgeObjectVersion` records.

---

## 10. Current Next Actions

1. Review the accumulated runtime import/readback batch after commit and push.
2. Continue deterministic Sprint 3 pipeline hardening with richer suggestion review/reporting.
3. Add package installer import fixtures for unsupported package schema version when manifest versioning is introduced.
4. Keep Ollama adapter unimplemented until deterministic review, package release, and runtime import flow remain stable after the committed batch.
5. Decide whether the next sprint slice should return to source ingestion depth or start runtime Q&A harness preparation.

---

**End of Sprint Plan**

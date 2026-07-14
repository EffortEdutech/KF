# Knowledge Factory Pre-Sprint Architecture Audit

**Date:** 2026-07-14  
**Status:** Pre-sprint correction note  
**Scope:** Documentation and implementation-readiness audit before Sprint 0

---

## 1. Purpose

This audit records corrections and risks identified before starting the Knowledge Factory implementation sprints.

It is intentionally separate from the frozen `docs/v1` baseline. The frozen documents remain the architecture source of truth. This file captures implementation-readiness decisions that should be resolved or reflected in the sprint checklist before coding begins.

---

## 2. Documents Reviewed

Baseline and roadmap:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/v1/00 - Knowledge Factory Documentation Series - Version 1.0 Frozen.md`
- `docs/v1/01 - Documentation Architecture - Version 1.0 Frozen.md`
- `docs/v1/TRY 1/00 - Documentation Map.md`
- `docs/v1/TRY 1/Volume A - Product Vision and Strategy.md`
- `docs/v1/TRY 1/Volume B - Product Requirements and MVP Scope.md`
- `docs/v1/TRY 1/Volume C - User Experience and Studio Design.md`
- `docs/v1/TRY 1/Volume D - Platform Architecture.md`
- `docs/v1/TRY 1/Volume E - Professional Knowledge Asset Specification.md`
- `docs/v1/TRY 1/Volume F - Intelligence Engine and Knowledge Manufacturing Pipeline.md`
- `docs/v1/TRY 1/Volume G - LADOS Runtime Integration.md`
- `docs/v1/TRY 1/Volume H - Local Development Architecture.md`
- `docs/v1/TRY 1/Volume I - Engineering Constitution.md`
- `docs/v1/TRY 1/Volume J - Development Roadmap.md`

Architecture series:

- `docs/v1/KF 1_0 - Vision, Philosophy & Product Strategy.md`
- `docs/v1/KF 1_1 - Platform Blueprint.md`
- `docs/v1/KF 1_2 - Knowledge Object Model.md`
- `docs/v1/KF 1_3 - Knowledge Manufacturing Pipeline.md`
- `docs/v1/KF 1_4 - Knowledge Workforce Architecture.md`
- `docs/v1/KF 2_0 - Mission Architecture.md`
- `docs/v1/KF 2_1 - Knowledge Object Repository (KOR).md`
- `docs/v1/KF 2_2 - Intelligence Engine.md`
- `docs/v1/KF 2_3 - Knowledge Factory Studio.md`
- `docs/v1/KF 2_4 - Platform Services.md`
- `docs/v1/KF 3_0 - Knowledge Governance.md`
- `docs/v1/KF 3_1 - Professional Knowledge Assets.md`
- `docs/v1/KF 3_2 - Marketplace & Ecosystem.md`
- `docs/v1/KF 4_0 - SDK & APIs.md`
- `docs/v1/KF 4_1 - Enterprise Edition.md`
- `docs/v1/KF 5_0 - Future Vision & Roadmap.md`
- `docs/v1/KF 5_1 - LADOS and PKA Runtime Integration.md`
- `docs/v1/KF 5_2 - Professional Knowledge Asset Packaging and Resource Size.md`
- `docs/v1/KF 5_3 - LADOS Server and Local AI Deployment Architecture.md`
- `docs/v1/KF 5_4 - Organizational Value and Business Outcomes.md`
- `docs/v1/KF 5_5 - Local Development and Knowledge Factory Pack Strategy.md`

Obsidian context:

- `Projects/KF/Overview.md`
- `Architecture/Graphify + Obsidian Workflow.md`

---

## 3. Graphify Findings

Graphify exists at `graphify-out/graph.json`.

Query results identify the relevant implementation-start cluster:

- Local Development and KF Pack Strategy
- LADOS and PKA Runtime Integration
- LADOS Server and Local AI Deployment Architecture
- Mission Architecture
- Knowledge Governance
- Knowledge Object Repository
- PKA Packaging and Resource Size
- Knowledge Factory Studio
- Intelligence Engine
- Platform Services

Graphify did not find a path between `Knowledge Factory Studio` and `Mission Architecture`, even though the direct documents clearly state that Studio is mission-driven and that Mission Centre is the operational heart of the Studio.

Conclusion: use Graphify as navigation support, but direct documentation is authoritative for this pre-sprint correction.

---

## 4. Required Corrections Before Sprint 0

### Correction 1 - Decide Host Strategy Before Scaffold

`KF 5_5 - Local Development and Knowledge Factory Pack Strategy.md` recommends that the first implementation should not be a fully separate Knowledge Factory application. It recommends building Knowledge Factory first as a Knowledge Factory Pack for LADOS.

The sprint plan previously treated this as a generic app framework choice. That is too loose.

Correction:

- Sprint 0 must explicitly decide the host strategy before scaffolding.
- Preferred default should be LADOS-compatible pack/module boundaries, even if the first local scaffold is a standalone development shell.
- The scaffold should avoid decisions that make later LADOS pack integration awkward.

### Correction 2 - Bring Missions Earlier

The architecture says every activity is a Mission, and Studio is mission-driven.

The sprint plan previously introduced pipeline jobs in Sprint 3, with no early Mission model.

Correction:

- Sprint 0 must define the minimal Mission model.
- Sprint 1 should include Mission Centre placeholder/navigation and create minimal Missions for project/source activities where practical.
- Pipeline jobs in Sprint 3 should be implemented as Missions or Mission-backed jobs, not an unrelated job model.

### Correction 3 - Define Canonical Lifecycle States Before Schema

The docs use closely related but not identical lifecycle wording:

- Draft
- AI Generated
- Pending Review / Under Review
- Expert Review / Expert Validated
- Validated / Approved
- Published
- Deprecated
- Archived

Correction:

- Sprint 0 must define the canonical MVP lifecycle state set.
- The data model should preserve a path to the richer frozen lifecycle.
- UI labels may be simplified, but stored states should not block later governance.

### Correction 4 - Add Minimal Organisation, Workspace, Identity, and Role Concepts Early

Platform Services, Workforce, Governance, and Enterprise docs all assume identities, organisations, workspaces, roles, permissions, owners, reviewers, and auditability.

Correction:

- Sprint 0 should define minimal local-first identity/role posture.
- Sprint 1 data models should include organisation/workspace/project ownership fields even if full authentication is deferred.
- Review and publication accountability must not be bolted on as an afterthought.

### Correction 5 - Use Model Router / Provider Abstraction Language

The docs require provider independence and `KF 5_3` recommends a Model Router rather than direct Ollama coupling.

Correction:

- Sprint 0 should define an AI provider/model router interface.
- Ollama should be the first local provider behind that interface, not a direct application dependency.

### Correction 6 - Add Source Licensing and Usage Metadata

PKA governance and marketplace documents require licensing, usage policy, ownership, contributor attribution, and IP governance.

Correction:

- Sprint 1 source metadata should include licensing/usage policy fields, even if optional for the first local MVP.
- PKA export should preserve source licensing metadata.

### Correction 7 - Repair Version Control State

The workspace contains an empty `.git` directory. `git status` reports that the folder is not a valid Git repository.

Correction:

- Sprint 0 should initialize or repair Git before implementation.
- Do not assume version control is active until `git status` succeeds.

---

## 5. Non-Blocking Observations

- Several frozen docs render typographic characters as mojibake in terminal output. This appears cosmetic in the shell rendering and should not be changed casually because the Version 1 docs are frozen.
- Marketplace, SDK, enterprise multi-tenancy, and full commercial licensing remain future scope for the MVP, but their metadata hooks should be designed early where cheap.
- Neo4j is optional for the earliest MVP if relationships are stored relationally first.
- PostgreSQL and pgvector are the documented preferred direction, but Sprint 0 may still decide whether to start with full local infrastructure or a lighter first scaffold.

---

## 6. Pre-Sprint Readiness Gate

Before coding begins, confirm:

- [ ] Host strategy: LADOS pack/module-first or standalone-first with LADOS-compatible boundaries.
- [ ] Canonical MVP lifecycle states.
- [ ] Minimal Mission model.
- [ ] Minimal organisation/workspace/project/identity model.
- [ ] AI provider/model router boundary.
- [ ] Local storage/database strategy.
- [ ] Git repository initialized or repaired.

---

**End of Audit**

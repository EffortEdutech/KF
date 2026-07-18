# Knowledge Factory Manufacturing Line Sprint Plan and Checklist

**Status:** Active execution plan  
**Created:** 2026-07-18  
**Execution objective:** Build Knowledge Factory as a repeatable manufacturing line for governed Professional Knowledge Assets.  
**Validation article:** QS/RFQ from BOQ Base PKA, used only to prove the factory works.

---

## 1. Purpose

This document replaces pilot-first execution with Knowledge Factory manufacturing-line execution.

The sprint objective is not to build a QS/RFQ app or a one-off pilot PKA. The objective is to build the reusable KF capability that can manufacture any governed PKA:

```text
Trusted Sources
  -> Source Intake
  -> Preparation and Extraction
  -> Knowledge Object Manufacturing
  -> Relationship and Evidence Manufacturing
  -> Human Governance
  -> PKA Assembly
  -> Release and Publication
  -> Runtime Handoff
  -> Consumption Validation
  -> Continuous Improvement
```

QS/RFQ remains the first test article moving through the factory. It should validate the line, not define the line.

---

## 2. Sprint Execution Rules

Each sprint must have one KF manufacturing capability goal.

Do not run sprints as loose "next plan" fragments. A sprint batch must define:

- factory capability being built,
- generic KF requirement,
- QS/RFQ validation scenario,
- must-finish checklist,
- acceptance demo,
- explicit deferred work,
- commit/push boundary.

Work is accepted only when it improves the repeatable PKA manufacturing line. Pilot-specific features are allowed only when they prove or harden a generic KF capability.

---

## 3. Anti-Crawl Rules

To prevent crawling item by item:

- No sprint may contain more than five must-finish deliverables.
- No new micro-task may be added unless it supports the sprint acceptance demo.
- A decision can be reopened only when its documented trigger is met.
- UI, store, tests, docs, and Graphify refresh are one deliverable batch, not separate future tasks.
- Commit at the end of each manufacturing capability batch.
- Defer broad hardening, extra filters, and exploratory surfaces unless they block the demo.

---

## 4. Manufacturing Line Definition

### Stage 1 - Source Intake

KF capability:

Register trusted source material with ownership, usage policy, provenance, storage reference, and processing status.

Generic requirement:

Any PKA project can declare source inputs without embedding runtime/client state.

QS/RFQ validation:

Register BOQ/RFQ sources as Base PKA inputs with traceable source records.

Acceptance demo:

A knowledge engineer creates/selects a project, registers sources, and sees source readiness before manufacturing starts.

### Stage 2 - Preparation and Extraction

KF capability:

Prepare source artifacts and extract chunks/candidates through a deterministic or provider-backed pipeline.

Generic requirement:

Extraction must produce traceable, reviewable candidates. AI output remains draft.

QS/RFQ validation:

BOQ/RFQ Markdown/text sources produce source chunks and deterministic KO/relationship suggestions.

Acceptance demo:

A source can be ingested, chunked, retried after failure, repaired, and traced through Missions/audit history.

### Stage 3 - Knowledge Object Manufacturing

KF capability:

Convert extracted candidates into governed Knowledge Objects with metadata, lifecycle state, evidence links, and ownership.

Generic requirement:

KOs are the reusable manufactured components of PKAs.

QS/RFQ validation:

BOQ/RFQ rules, checklist items, workflow concepts, and evidence controls become Knowledge Objects.

Acceptance demo:

A candidate can be accepted into a draft KO, reviewed, edited only while allowed, and promoted to release-grade status.

### Stage 4 - Relationship and Evidence Manufacturing

KF capability:

Create governed KO relationships with provenance, source evidence, confidence, and quality signals.

Generic requirement:

Relationships must support retrieval, graph inspection, package export, and governance review.

QS/RFQ validation:

RFQ completeness, BOQ evidence, workflow gates, and register items are connected through governed graph relationships.

Acceptance demo:

The graph shows relationship quality, source-backed evidence, provenance, and review history.

### Stage 5 - Human Governance

KF capability:

Review, approve, reject, request changes, version, and audit KOs, relationships, package decisions, and evidence controls.

Generic requirement:

No PKA can publish with release-blocking governance gaps.

QS/RFQ validation:

QS/RFQ KOs and evidence controls cannot become authoritative until approved; blocked RFQ gate actions hard-block publish.

Acceptance demo:

The Review and PKA Builder gates show blockers, remediation actions, decision history, and clear release readiness.

### Stage 6 - PKA Assembly

KF capability:

Assemble approved KOs, relationships, source references, governance records, ontology, and component indexes into a structured Base PKA package.

Generic requirement:

Package structure is generic, inspectable, versioned, and runtime-boundary aware.

QS/RFQ validation:

QS/RFQ package exports `manifest.json`, KO index, graph, sources, governance, workflow placeholder, evidence register, and runtime handoff.

Acceptance demo:

A draft package can be assembled, inspected, diffed/replaced before publish, and validated for package completeness.

### Stage 7 - Release and Publication

KF capability:

Separate draft assembly from release approval and immutable publication.

Generic requirement:

Published PKA versions are retained and cannot be overwritten.

QS/RFQ validation:

QS/RFQ Base PKA moves through draft, under review, approved, and published without bypassing governance.

Acceptance demo:

A published package has release decisions in governance exports, archive readback, and ZIP readback.

### Stage 8 - Runtime Handoff

KF capability:

Expose a package handoff contract that tells runtime/app developers what is safe, blocked, review-required, or excluded.

Generic requirement:

Runtime apps consume PKA packages and focused governed context; they do not receive runtime vault state or client data from KF.

QS/RFQ validation:

`runtime/app-developer-handoff.json` tells AIFA/LADOS-style consumers how to inspect QS/RFQ package files, governance fields, relationship evidence policy, and RFQ risk policy.

Acceptance demo:

`/runtime-handoff` loads the handoff file, maps installer checks to decisions, records feedback, and preserves the relationship evidence table trigger.

### Stage 9 - Consumption Validation

KF capability:

Validate that a runtime/import harness can read a published PKA package deterministically before any AI execution.

Generic requirement:

Package installability must be checked without Ollama/model calls.

QS/RFQ validation:

Runtime import and Runtime Q&A readiness load the published QS/RFQ package, approved KOs, governed relationships, and citations.

Acceptance demo:

Runtime import/readback and deterministic Q&A readiness pass using only published package context.

### Stage 10 - Continuous Improvement

KF capability:

Capture feedback, quality metrics, package readback issues, and source-change triggers for future manufacturing revisions.

Generic requirement:

PKAs are living products; improvements must return through the KF governance/manufacturing line.

QS/RFQ validation:

Runtime handoff feedback can request relationship evidence lifecycle improvements without immediately changing the schema.

Acceptance demo:

Feedback is recorded, summarized, thresholded, and routed into the next manufacturing-line sprint only when the trigger is met.

---

## 5. Current Factory Capability Status

| Stage | Status | Current reality |
| --- | --- | --- |
| 1. Source Intake | `[x]` | Project/source registration exists with metadata, policy, processing status, and storage references. |
| 2. Preparation and Extraction | `[~]` | Markdown/text extraction, chunking, repair, retry, and deterministic suggestions exist. PDF/Word/spreadsheet extraction is deferred. |
| 3. KO Manufacturing | `[~]` | Manual and suggestion-created KOs exist with evidence and lifecycle. Needs cleaner generic work-order flow beyond pilot shortcuts. |
| 4. Relationship and Evidence Manufacturing | `[~]` | Relationships, provenance, source evidence, graph quality, and feedback threshold exist. Dedicated relationship evidence records are deferred. |
| 5. Human Governance | `[~]` | Review queue, release blockers, package decisions, audit history, and RFQ gate actions exist. Governance work should become more generic. |
| 6. PKA Assembly | `[~]` | Package assembly/export/readback exists. Component indexes are still placeholders. |
| 7. Release and Publication | `[x]` | Draft/review/approve/publish workflow and immutable published exports exist. |
| 8. Runtime Handoff | `[~]` | Handoff JSON, negative fixtures, installer mapping, and feedback records exist. Needs generic app-developer handoff polish. |
| 9. Consumption Validation | `[~]` | Runtime import and deterministic Q&A readiness exist without model calls. True retrieval/runtime engine is later work. |
| 10. Continuous Improvement | `[ ]` | Feedback exists, but no structured revision planning loop yet. |

---

## 6. Active Sprint Batch - Complete The Generic PKA Manufacturing Line

**Sprint goal:** A Knowledge Factory operator can manufacture, govern, publish, hand off, and validate a Base PKA through a reusable generic flow, using QS/RFQ only as the validation article.

**Sprint boundary:** Finish the generic manufacturing-line demo before adding Ollama, new extraction formats, a dedicated relationship evidence table, marketplace features, or runtime app behavior.

### Must Finish

- [x] Add a Manufacturing Line dashboard or section that shows the ten factory stages and current readiness for the selected project/package.
- [x] Replace pilot-only language in operator-facing surfaces where the concept is generic PKA manufacturing.
- [x] Add a generic Manufacturing Run Report that summarizes source intake, extraction, KO manufacturing, relationship/evidence manufacturing, governance, package assembly, release, handoff, and consumption validation.
- [x] Ensure QS/RFQ vertical slice validates the generic Manufacturing Run Report without becoming the sprint objective.
- [x] Commit and push the completed manufacturing-line planning and first generic execution surface.

### Batch 2 Must Finish - Generic Manufacturing Work Orders

- [x] Add manufacturing mission/work-order vocabulary.
- [x] Add Source-to-KO work-order summary.
- [x] Add KO-to-package work-order summary.
- [x] Add reusable run/retry/control links and Mission-backed work-order trace creation.
- [x] Add clear human approval checkpoints for each work order.

### Batch 3 Must Finish - Component Manufacturing

- [x] Decide first dedicated component records beyond Knowledge Objects.
- [x] Add generic component readiness checks for workflows, rules, templates, prompts, formulas, and cases.
- [x] Keep placeholders where a component is not required yet.
- [x] Surface component manufacturing readiness in PKA Builder.
- [x] Validate QS/RFQ workflow contract as a manufactured component without making runtime workflow execution a KF responsibility.

### Batch 4 Must Finish - PKA Product Quality

- [x] Add trust/readiness score outline.
- [x] Add source diversity and freshness indicators.
- [x] Add governance coverage summary.
- [x] Add relationship density and evidence coverage.
- [x] Add package quality report in PKA Builder.

### Batch 5 Must Finish - Runtime Consumption Contract

- [x] Review generic handoff schema across AIFA, LADOS, and future runtimes.
- [x] Add app-developer checklist for any Base PKA.
- [x] Align runtime import/readback fixtures with handoff decisions.
- [x] Add runtime consumer profile decisions for Generic Runtime, AIFA, and LADOS.
- [x] Keep feedback loop routed into Continuous Improvement without adding runtime execution.

### Batch 1-5 Integrated Factory Flow Review - 2026-07-18

Status:

- [x] Batch 1 makes the ten-stage manufacturing line visible from `/manufacturing-line`.
- [x] Batch 2 converts the line into reusable manufacturing work orders and Mission traces.
- [x] Batch 3 distinguishes manufactured PKA components from intentional placeholder indexes.
- [x] Batch 4 makes PKA product quality measurable before release.
- [x] Batch 5 defines the runtime consumption contract for Generic Runtime, AIFA, and LADOS without adding runtime execution.

Integrated finding:

The factory can now show where a Base PKA is in the line, assemble and publish a package, validate handoff/import readiness, and collect runtime-consumer feedback. The next gap is governance closure: an operator needs one final manufacturing disposition that clearly says whether the PKA is accepted for release, must return to a specific rework stage, or is blocked from publication.

### Batch 6 Must Finish - PKA Manufacturing Governance Closure

- [x] Add a generic governance closure report that combines manufacturing stages, work orders, release blockers, product quality, package validation, runtime handoff, and consumption validation into one release disposition.
- [x] Surface closure disposition in Studio as `accepted_for_release`, `rework_required`, or `release_blocked`, with human-readable reasons and links to the exact factory stage/work order.
- [x] Add rework routing actions or trace creation so closure issues return to Source-to-KO, Relationship/Governance, KO-to-Package, Runtime Validation, or Continuous Improvement work orders.
- [x] Validate the closure report with the QS/RFQ Base PKA article while keeping the decision vocabulary generic.
- [x] Update tests, docs, and Graphify; commit and push Batch 6 as one governance-closure capability batch.

### Batch 7 Must Finish - Relationship and Evidence Closure

- [x] Add a generic relationship/evidence closure report that classifies every project graph edge as `release_grade`, `needs_rework`, or `excluded_from_release`.
- [x] Surface relationship closure in Studio with counts, reasons, and direct remediation controls for provenance, source evidence, confidence, and approval status.
- [x] Add an explicit exclude/defer-for-release posture for useful working edges that should not block PKA product closure.
- [x] Feed the relationship closure report into `getPkaManufacturingClosureReport` so Stage 4 can reach ready only when package-relevant relationships are release-grade or intentionally excluded.
- [x] Validate QS/RFQ can move from `rework_required` to `accepted_for_release` without adding Ollama, runtime execution, or a dedicated relationship evidence table.

### Acceptance Demo

1. Open Studio on `http://localhost:4700`.
2. Select the QS/RFQ validation project.
3. Run or reuse the manufacturing line.
4. Show the Manufacturing Line status across all ten stages.
5. Open the published PKA package.
6. Open Runtime Handoff and Runtime Import.
7. Confirm the PKA is manufactured, governed, published, handed off, and consumption-validated through generic KF capability.

### Deferred

- Ollama adapter implementation.
- PDF/Word/spreadsheet extraction.
- Dedicated relationship evidence table.
- Marketplace/distribution.
- Client-adapted PKA instances.
- Runtime workflow execution.
- Runtime vault/client state.

---

## 7. Sprint Batch Backlog

### Batch 1 - Manufacturing Line Visibility

Goal:

Make the KF manufacturing line visible and executable as a product capability.

Deliverables:

- Manufacturing Line status surface.
- Generic Manufacturing Run Report.
- Ten-stage readiness checks.
- QS/RFQ validation scenario.
- Docs/checklist update.

Done when:

The user can see where a PKA is in the factory, not just click isolated pages.

### Batch 2 - Generic Manufacturing Work Orders

Goal:

Move from one-click pilot actions toward reusable manufacturing work orders.

Deliverables:

- Manufacturing mission/work-order vocabulary.
- Source-to-KO work-order summary.
- KO-to-package work-order summary.
- Reusable run/retry controls.
- Clear human approval checkpoints.

Done when:

Any PKA project can follow the same work-order skeleton as QS/RFQ.

Implementation status:

- [x] `getManufacturingWorkOrderReport` derives five generic work orders from current project artifacts and Mission traces.
- [x] `/manufacturing-line` shows the work-order skeleton, source-to-KO summary, KO-to-package summary, owner role, input/output signals, approval checkpoint, run control, and trace creation.
- [x] Work-order trace creation writes a Mission with a stable `manufacturing:<work-order-id>` stage.
- [x] QS/RFQ validates the work-order skeleton without becoming the sprint objective.

### Batch 3 - Component Manufacturing

Goal:

Turn placeholder package components into manufactured assets where needed.

Deliverables:

- Decide first dedicated component records beyond Knowledge Objects.
- Add generic component readiness checks for workflows, rules, templates, prompts, formulas, and cases.
- Keep placeholders where a component is not required yet.

Done when:

PKA assembly distinguishes missing required components from intentionally empty placeholders.

Implementation status:

- [x] `getPkaComponentManufacturingReport` distinguishes required manufactured components, conditional components, intentional placeholders, and missing required package pieces.
- [x] `workflows/rfq-package-issue-workflow.json` is treated as the first manufactured component contract file.
- [x] Runtime config, prompts, rules, templates, formulas, cases, and generic workflow library indexes remain intentional placeholders until their promotion triggers are met.
- [x] PKA Builder shows component manufacturing metrics, boundaries, dedicated-record decisions, and promotion triggers.

### Batch 4 - PKA Product Quality

Goal:

Make PKA quality measurable.

Deliverables:

- Trust/readiness score outline.
- Source diversity and freshness indicators.
- Governance coverage summary.
- Relationship density and evidence coverage.
- Package quality report.

Done when:

KF can explain why a PKA is release-grade or not.

Implementation status:

- [x] `getPkaProductQualityReport` computes a weighted quality score and quality band.
- [x] Product quality categories cover source quality, governance coverage, relationship evidence, package completeness, and runtime handoff.
- [x] PKA Builder shows score, category signals, recommended actions, and top risks.
- [x] QS/RFQ validates the report without making the pilot-specific domain the product goal.

### Batch 5 - Runtime Consumption Contract

Goal:

Make app-developer consumption generic across AIFA, LADOS, and future runtimes.

Deliverables:

- Generic handoff schema review.
- App-developer checklist for any Base PKA.
- Runtime import/readback fixtures aligned with handoff.
- Feedback loop into continuous improvement.

Done when:

A runtime developer can inspect a Base PKA without knowing the pilot internals.

Implementation status:

- [x] `getRuntimeConsumptionContractReport` maps a published package into Generic Runtime, AIFA, and LADOS installer profiles.
- [x] `/runtime-handoff` shows profile decisions, supported/required capabilities, unsupported capabilities, context boundaries, generic checklist checks, and next actions.
- [x] AIFA can require installation review for non-finance/non-bookkeeping packages while LADOS remains installable when deterministic handoff/import checks pass.
- [x] Feedback still records into package governance history and Continuous Improvement gates; no runtime execution was added.

### Batch 6 - PKA Manufacturing Governance Closure

Goal:

Create the factory's final acceptance/rework/release gate for manufactured Base PKAs.

Deliverables:

- Generic governance closure report.
- Studio closure disposition surface.
- Rework routing into the existing manufacturing work-order skeleton.
- QS/RFQ validation article coverage.
- Tests, docs, Graphify refresh, and commit/push.

Done when:

A KF operator can open the Studio and see whether a manufactured PKA is accepted for release, must return to a specific factory stage for rework, or is blocked from publication.

Implementation status:

- [x] `getPkaManufacturingClosureReport` derives a final factory disposition from manufacturing stages, work orders, release blockers, product quality, package validation, runtime handoff, and consumption validation.
- [x] `/manufacturing-line` shows the closure disposition, closure metrics, closure reasons, route links, and rework trace creation controls.
- [x] Runtime smoke validates `release_blocked` for missing source extraction and `rework_required` for relationship/evidence manufacturing gaps.
- [x] QS/RFQ currently validates the closure gate by showing that a published/runtime-ready package can still require relationship-governance rework before full factory acceptance.
- [x] Graphify refreshed for the closure report symbols; commit/push pending.

### Batch 7 - Relationship and Evidence Closure

Goal:

Close the generic Stage 4 manufacturing gap so only release-grade, evidence-backed, governed relationships participate in PKA product closure.

Deliverables:

- Relationship/evidence closure report.
- Studio surface for relationship closure reasons and remediation.
- Explicit release exclusion/defer posture for non-package graph edges.
- Closure integration so package-relevant graph edges can unblock `accepted_for_release`.
- QS/RFQ validation article moves from relationship rework to accepted factory closure.

Done when:

A KF operator can distinguish working graph edges from release-grade PKA relationships, repair or exclude non-release-grade edges, and see the manufacturing closure gate reach `accepted_for_release` without adding runtime execution or AI model calls.

Implementation status:

- [x] `getRelationshipEvidenceClosureReport` classifies relationships as `release_grade`, `needs_rework`, or `excluded_from_release`.
- [x] `/ontology` shows relationship closure metrics, closure reasons, remediation forms, source evidence attachment, and release-exclusion controls.
- [x] Package export now counts and exports release-grade relationships only.
- [x] Manufacturing Line Stage 4 and product quality use release-grade relationship closure instead of raw approved-edge counts.
- [x] Store contract validates QS/RFQ can reach `accepted_for_release` after non-release-grade working edges are explicitly excluded; runtime smoke validates the visible remediation path.

---

## 8. Decision Gates

| Decision | Current decision | Reopen trigger |
| --- | --- | --- |
| Ollama adapter | Deferred | Generic deterministic manufacturing line is stable end to end. |
| Dedicated relationship evidence table | Deferred | Two or more independent runtime/app-developer feedback records request multi-source relationship evidence lifecycle. |
| PDF/Word/spreadsheet extraction | Deferred | The next validation article requires those source formats. |
| Dedicated component records | Partial/deferred | A package component needs independent lifecycle, governance, reuse, or versioning beyond a KO. |
| App-developer review table | Deferred | Audit-backed handoff feedback becomes too thin after repeated real app-developer review. |
| Runtime workflow execution | Out of KF scope for now | LADOS/AIFA integration requires an execution contract after package handoff stabilizes. |

---

## 9. Operating Cadence

For each sprint batch:

1. Confirm the factory capability goal.
2. Implement the capability across UI, store/API, tests, and docs in one batch.
3. Validate with QS/RFQ as the sample workpiece.
4. Run `corepack pnpm check`.
5. Run `corepack pnpm test:runtime` when browser/runtime behavior changed.
6. Refresh Graphify after structural changes.
7. Commit and push with a capability-level commit message.
8. Report:
   - completed,
   - ad-hoc needed,
   - documentation updated,
   - Graphify status,
   - next manufacturing-line batch.

---

## 10. Current Next Action

Close **Batch 7 - Relationship and Evidence Closure** with commit/push, then decide the next factory batch.

The current QS/RFQ validation article can reach `accepted_for_release` through the store contract once non-release-grade working graph edges are explicitly excluded from release. The browser path validates the operator can inspect relationship closure and update release posture from `/ontology`.

Do not add runtime workflow execution, component database tables, Ollama, broad extraction formats, marketplace distribution, or a dedicated relationship evidence table unless they block the governance closure or its documented follow-up.

---

**End of Manufacturing Line Sprint Plan**

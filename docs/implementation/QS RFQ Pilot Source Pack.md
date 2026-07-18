# QS/RFQ Pilot Source Pack

**Status:** Active pilot input  
**Date:** 2026-07-17  
**Pilot:** Quantity Surveying / Request for Quotation from Bill of Quantity

---

## Purpose

This pilot source pack gives Knowledge Factory one concrete product target: manufacture a small governed Base PKA that helps a runtime reason about RFQ package completeness from BOQ material.

The pilot is intentionally narrow. It is not a full Quantity Surveying operating system, procurement platform, or tendering app.

---

## Source Pack

| Source | Path | Purpose |
| --- | --- | --- |
| Sample BOQ for RFQ Package | `storage/sources/src-boq-sample/source.md` | Architectural finishes and structural concrete BOQ items, measurement basis, inclusions/exclusions, assumptions, and RFQ evidence requirements. |
| RFQ Template Structure | `storage/sources/src-rfq-template/source.md` | RFQ return requirements, clarification log fields, package issue-readiness checks, and a clarification/evidence register example. |

---

## Operator Recipe

1. Open `/pipeline?projectId=kf-qs-rfq-pilot`.
2. Run **QS/RFQ pilot vertical slice**.
3. Inspect the created chunks, KO suggestions, relationship suggestions, accepted KOs, and graph relationships.
4. Open PKA Builder to inspect the published `QS/RFQ From BOQ Base PKA`.
5. Open Runtime Import to confirm package importability.
6. Open Runtime Q&A to inspect deterministic context readiness and fixture answers.

---

## Expected Pilot Knowledge

The deterministic fixture should produce reviewable knowledge around:

- BOQ item evidence required before RFQ issue,
- RFQ BOQ scope completeness checks,
- provisional quantity assumptions,
- RFQ package issue template,
- RFQ return requirements,
- tender clarification log procedure,
- structural BOQ RFQ evidence requirements,
- RFQ clarification and evidence register boundaries.

All outputs remain governed records. The pilot action may approve them for the local proof of concept, but production use still requires human QS review against the actual contract, drawings, specifications, and procurement policy.

---

## Runtime Demo Questions

- What should be checked before issuing an RFQ package from a BOQ?
- Which approved knowledge supports the RFQ completeness workflow?
- Can draft pipeline suggestions be used as runtime answer context?

The Runtime Q&A page answers these deterministically from the published package context. No AI provider, Ollama adapter, embedding search, or model call is used.

---

## Visual Inspection - 2026-07-17

Inspection route:

1. Started Studio on `http://localhost:4700`.
2. Opened `/pipeline?projectId=kf-qs-rfq-pilot`.
3. Ran **QS/RFQ pilot vertical slice**.
4. Inspected Runtime Q&A, Pipeline, Knowledge Objects, Ontology, and PKA Builder.

Screenshots captured locally:

- `C:\tmp\kf-runtime-qa.png`
- `C:\tmp\kf-pipeline.png`
- `C:\tmp\kf-kos.png`
- `C:\tmp\kf-ontology.png`
- `C:\tmp\kf-pka-builder.png`

Observed pass results:

- Pipeline shows the QS/RFQ pilot source pack and source-specific chunks.
- Deterministic pilot run publishes a `QS/RFQ From BOQ Base PKA`.
- Runtime Q&A reports:
  - package status: `published`,
  - approved KOs: `4`,
  - graph edges: `3`,
  - model calls: `0`,
  - answer readiness: `ready`,
  - fixture evaluation: `ready`.
- PKA Builder shows clear release readiness and package export surfaces.
- Runtime Q&A makes the boundary explicit: published package and approved KOs only; no draft suggestions, client vault state, runtime user data, model calls, Ollama, embedding, or retrieval ranking.

---

## Professional Review

The manufactured pilot is acceptable as a proof-of-concept Base PKA. It demonstrates the correct Knowledge Factory product shape:

- source-backed Knowledge Objects,
- evidence-linked professional rules/checklist/template objects,
- governed graph relationships,
- published package export,
- deterministic runtime context bundle,
- cited deterministic Q&A demo.

It is not yet professionally sufficient as a production QS/RFQ knowledge asset.

Professional gaps:

- The BOQ sample is still small. It now covers one architectural finishes example and one structural concrete example only.
- The package lacks trade coverage across MEP, preliminaries, testing, handover, temporary works, and commercial return scopes.
- The RFQ checklist does not yet distinguish mandatory, recommended, optional, and clarification-only items.
- The workflow does not yet model RFQ package issue stages such as prepare, review, approve, issue, clarify, receive quotation, compare, negotiate, and award recommendation.
- There is no proper evidence register model for drawings, specifications, addenda, site information, subcontractor clarifications, and commercial return documents.
- The package uses placeholders for rules, workflows, templates, formulas, and cases instead of dedicated component records.
- The runtime demo is deterministic and cited, but it is not a real retrieval/ranking or answer-generation engine.

---

## Pilot Hardening - 2026-07-17

Implemented hardening:

- The pilot run is idempotent by default. If the current published pilot package is ready and already contains the latest handoff/workflow files, rerunning the button reuses it instead of creating another package version.
- A compact **Pilot Run Report** is visible in Pipeline and summarizes source intake, approved KOs, governed relationships, package handoff, and Runtime Q&A readiness.
- The PKA export now includes `workflows/rfq-package-issue-workflow.json` as the first RFQ workflow component placeholder with prepare, review, approve/issue, clarify, and receive/compare stages.
- The PKA export now includes `runtime/app-developer-handoff.json` as the concise app-developer package handoff index.
- The source pack now includes one additional structural concrete BOQ trade section and one clarification/evidence register example.

Product gaps:

- Relationship evidence is still stored through relationship provenance fields, which is acceptable for the pilot but may need a dedicated evidence table once multiple evidence links per relationship matter.
- The graph is inspectable, but not yet a domain ontology. Object/relationship vocabularies remain fixed MVP terms.

---

## Visual Inspection - 2026-07-17 Pilot Hardening

Inspection route:

1. Started Studio on `http://localhost:4700`.
2. Opened `/pipeline?projectId=kf-qs-rfq-pilot`.
3. Reran **QS/RFQ pilot vertical slice**.
4. Confirmed Runtime Q&A readiness and returned to Pipeline.
5. Inspected persisted package export files under `storage/exports/pka-qs-rfq-from-boq-pka-pilot-0-1-0`.

Observed pass results:

- Runtime Q&A still reports package status `published`, `4` approved KOs, `3` graph edges, `0` model calls, answer readiness `ready`, and fixture evaluation `ready`.
- Pipeline **Pilot Run Report** shows `Pilot output ready`, `2/2` pilot sources ingested, `4` approved KOs, `3` approved graph edges, published package handoff, and Runtime Q&A contract ready.
- Rerunning the pilot reused the current published package rather than creating a new `0.1.3` export folder.
- `package-archive.json` includes `workflows/rfq-package-issue-workflow.json` and `runtime/app-developer-handoff.json`.
- `package.zip` includes the same workflow and handoff files.

Decision:

The next pilot slice should deepen QS extraction and evidence modeling before building a dedicated RFQ workflow UI. The current workflow component is a useful package contract, but the product will become more professionally credible if the next step turns BOQ/RFQ evidence into stronger governed records first.

Recommended next implementation focus:

1. Use the structured RFQ evidence register as the control record for RFQ package issue readiness.
2. Convert structural BOQ and clarification-register suggestions into accepted/reviewable pilot KOs.
3. Use QS-oriented evidence quality categories such as issued evidence, missing evidence, assumptions, addenda, subcontractor return, and commercial exception.
4. Build the RFQ workflow UI on top of register readiness after persistence and reviewer actions are stable.
5. Keep Ollama deferred until this deterministic handoff remains stable.

---

## RFQ Evidence Register Slice - 2026-07-17

Implemented:

- Added a schema-level `RfqEvidenceRegisterEntry` table placeholder and migration for future database persistence.
- Moved RFQ evidence register reads/writes behind the Prisma-backed store when `DATABASE_URL` is active, with the previous in-memory fallback retained for no-database local runs.
- Added a first service-level RFQ evidence register for the QS/RFQ pilot with categories:
  - `issued_evidence`,
  - `missing_evidence`,
  - `assumption`,
  - `addendum`,
  - `subcontractor_return`,
  - `commercial_exception`.
- Added evidence statuses:
  - `draft`,
  - `under_review`,
  - `accepted`,
  - `clarification_required`,
  - `superseded`.
- Promoted named pilot suggestions through review, including:
  - `Structural BOQ RFQ evidence requirement`,
  - `RFQ clarification and evidence register`.
- Added governed relationships for the newly promoted pilot KOs so PKA release gates remain strict.
- Exported the register as `sources/rfq-evidence-register.json`.
- Added `evidence_register` as a PKA component kind.
- Extended the RFQ workflow placeholder with evidence gate readiness.
- Added a Pipeline **RFQ evidence register** panel showing entries, categories, statuses, and future workflow gate readiness.
- Added Pipeline filters and detail inspection by category, status, trade section, workflow gate, and selected register entry.
- Added reviewer actions to accept, request clarification, or supersede register entries with governance audit history.
- Added an RFQ workflow gate report that evaluates active evidence readiness, excludes superseded entries, blocks unresolved missing evidence/clarifications/commercial exceptions, and produces gate-level remediation prompts.
- Added RFQ workflow gate summaries and RFQ evidence reviewer decision summaries into `governance/index.json`, archive readback, ZIP readback, and runtime import checks.
- Promoted RFQ workflow gate actions to a dedicated Prisma table with action type, owner, due date, status, reviewer notes, and linked evidence entry IDs.
- Added gate action filtering/history in Pipeline by gate, status, and owner.
- Added action-to-evidence-entry linking for multi-entry workflow gates.
- Added RFQ workflow gate action summaries into `governance/index.json`, archive readback, ZIP readback, and runtime import checks.
- Added a dedicated `/rfq-workflow` route for RFQ gate readiness, action metrics, filtering, history, update, and close controls.
- Added action ageing and overdue/due-today indicators on `/rfq-workflow`.
- Added action-level audit drilldown so reviewer/publisher updates remain inspectable from each RFQ gate action.
- Added RFQ blocked/overdue gate action risk summaries into package validation, `governance/index.json`, archive readback, ZIP readback, and runtime import checks before publish/handoff.
- Added `/rfq-workflow` action history filtering by computed due state.
- Finalized the pilot publish gate decision: unresolved `blocked` RFQ workflow actions hard-block PKA publishing; overdue actions remain visible risks that can be re-dated or closed by humans.
- Added the QS/RFQ package readback checklist to `PKA Package Installer Contract for Runtime Apps` so AIFA/LADOS-style developers know which package files and governance fields to inspect.
- Completed visual Studio/package handoff inspection after the publish hard-block change. The inspection confirmed Runtime Q&A readiness, persisted handoff JSON visibility, blocked-action risk readback, runtime import allowance, and RFQ workflow due-state filtering.
- Expanded `runtime/app-developer-handoff.json` with installer checklist, governance requirements, RFQ risk policy, relationship evidence policy, feedback questions, and the next developer-consumption slice.
- Added `/runtime-handoff` as the consuming-app readback surface. It loads `runtime/app-developer-handoff.json`, maps handoff checks to `installable`, `blocked`, or `installation_review_required`, and exposes relationship evidence feedback prompts for the pilot.
- Visually inspected `/runtime-handoff` against a published QS/RFQ package and added negative handoff fixtures for installer developers:
  - missing handoff-required package file -> `blocked`,
  - runtime-owner review policy -> `installation_review_required`.
- Added audit-backed app-developer handoff feedback records on `/runtime-handoff`. Pilot consumers can record whether relationship evidence provenance is enough or whether multi-source relationship evidence lifecycle is needed.
- Added the pilot feedback threshold: one multi-source lifecycle request is monitored while the pilot keeps provenance evidence; two or more independent requests trigger dedicated relationship evidence record design.

Professional interpretation:

The RFQ evidence register is still a pilot-grade control surface, not a complete QS tender register. It now demonstrates the right product direction: evidence is structured, categorized, linked to approved KOs and source excerpts, reviewable by humans, and able to drive RFQ workflow gate readiness.

Remaining gaps:

- The RFQ evidence register and workflow gate action migrations must be applied in each database-backed environment before those records become durable there.
- Register entries are deterministic pilot fixtures, not extracted with a production parser.
- Gate remediation actions are now table-backed and have a dedicated RFQ workflow route with ageing, overdue indicators, audit drilldown, and package risk summaries, but assignment workload analytics are still pilot-grade.
- Relationship evidence still uses structured provenance fields rather than a dedicated multi-evidence relationship table.
- Relationship evidence should stay in structured provenance for this pilot unless app-developer/package feedback proves a need for independent relationship-evidence lifecycle, multi-source evidence sets, or a separate graph-evidence export index.

---

## Recommended Next Slice

Before expanding extraction formats or Ollama, harden RFQ workflow operations:

1. Continue QS/RFQ package consumption review using `KnowledgeRelationship.provenance.sourceEvidence` while feedback stays below the repeated-signal threshold.
2. Start dedicated relationship evidence record design only after two or more independent pilot consumers request multi-source lifecycle or independent relationship-evidence review.
3. Decide after the pilot whether app-developer feedback needs a dedicated review table or whether audit-backed governance events remain sufficient.
4. Keep Ollama deferred until the deterministic evidence-register and handoff path remains stable.

---

**End of QS/RFQ Pilot Source Pack**

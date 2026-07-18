# PKA Component Boundary Decision

**Status:** Accepted implementation guidance  
**Date:** 2026-07-16  
**Sprint:** Sprint 2 - Knowledge Object Repository MVP

---

## 1. Purpose

Knowledge Factory manufactures Professional Knowledge Assets as governed packages made from smaller reusable components.

This note decides which early PKA components remain Knowledge Objects and which should receive dedicated records as the product grows.

---

## 2. Decision

Use Knowledge Objects as the governed core unit for professional meaning.

Use dedicated records when the component has its own structure, lifecycle mechanics, execution behavior, or package/export role that would become awkward if forced into a generic Knowledge Object.

---

## 3. Remain Knowledge Objects

These components should initially remain Knowledge Objects:

- Concepts and definitions.
- Professional rules expressed as reviewable knowledge.
- Procedures and step descriptions.
- Checklist items.
- Case references and lessons learned.
- Formula explanations and calculation rationale.
- Template explanations and usage guidance.
- Prompt/instruction explanations.

Reason: these items are primarily professional knowledge statements that need evidence, review, lifecycle state, relationships, and governance.

---

## 4. Dedicated Records

These components should receive dedicated records when implemented:

- Source artifacts and source evidence links.
- Relationship graph edges.
- Ontology terms, type configuration, and controlled vocabulary.
- Executable workflow definitions.
- Template files or generated document structures.
- Formula libraries with machine-readable inputs/outputs.
- Prompt libraries and model/runtime instruction bundles.
- PKA package manifests and component indexes.
- Governance events, audit logs, reviews, and version snapshots.
- Runtime configuration and capability requirements.

Reason: these items need specialized fields, validation, execution/loading behavior, or package structure beyond generic KO text.

---

## 5. Practical Rule

If the item answers "what professional knowledge should be governed and reused?", start as a Knowledge Object.

If the item answers "how should the PKA execute, load, export, validate, render, or audit this?", use a dedicated record.

---

## 6. Current Sprint 2 Application

Sprint 2 keeps Knowledge Objects as the repository center.

Dedicated records already exist for:

- `Source`
- `SourceEvidence`
- `KnowledgeRelationship`
- `Review`
- `AuditLog`
- `PkaPackage`

This keeps source evidence, graph edges, review/governance history, and package manifests structurally separate while preserving Knowledge Objects as the core governed content.

Sprint 5 adds relationship-level source evidence attachment as structured `KnowledgeRelationship.provenance.sourceEvidence`.
This is an intentional interim shape: it gives each graph edge source-backed evidence, audit history, Review remediation, and package validation visibility without adding another table before the graph evidence model settles.
If relationship evidence needs its own lifecycle, multi-source evidence set, reviewer workflow, or export index, promote it to a dedicated relationship evidence record in a later Sprint 5/Sprint 6 hardening slice.

---

## 7. Future Impact

Sprint 6 PKA Builder should export both:

- Knowledge Objects as governed content records.
- Dedicated component indexes for graph, ontology, templates, prompts, formulas, workflows, runtime config, source references, and governance history.

Runtime apps such as LADOS and AIFA should retrieve focused governed context from both Knowledge Objects and dedicated component indexes through a retrieval boundary, not by loading the whole PKA into an AI model.

---

## 8. Manufacturing Line Batch 3 Application

Batch 3 adds a component-manufacturing readiness distinction without adding new component tables.

Current decision:

- Required manufactured package components: Knowledge Object index, ontology vocabulary, relationship graph, source reference index, and governance record index.
- Conditional manufactured component: `workflows/rfq-package-issue-workflow.json`, because the QS/RFQ validation article needs a governed workflow contract for package issue readiness.
- Intentional placeholders: runtime configuration, prompts, rules, templates, formulas, cases, and generic workflow library index.

The RFQ workflow contract is a component contract file, not a runtime workflow engine. KF manufactures the governed workflow structure and handoff boundary. Runtime execution remains outside Base PKA scope.

Do not promote prompts, rules, templates, formulas, cases, runtime config, or workflow libraries into dedicated records until one of these triggers appears:

- independent review lifecycle,
- reusable authoring/editing surface,
- package-level version history,
- runtime loading/execution behavior,
- validation rules that exceed a Knowledge Object,
- repeated app-developer feedback requesting the dedicated component.

Rules and formula explanations remain Knowledge Objects until they need executable or machine-readable behavior. Prompt libraries remain deferred while Ollama/model integration is gated.

---

**End of PKA Component Boundary Decision**

# PKA Export Strategy

**Status:** Active implementation guidance  
**Date:** 2026-07-16  
**Sprint:** Sprint 6 - PKA Builder and Export

---

## 1. Purpose

Knowledge Factory exports a Base Professional Knowledge Asset as an inspectable local package before introducing distribution infrastructure.

This note defines the current export shape, package release workflow, package update strategy, archive posture, and the boundary between Base PKA content and runtime vault or client state.

---

## 2. Current Export Shape

Draft package assembly writes JSON files under:

```text
storage/exports/<packageId>
```

Current package files:

- `manifest.json`
- `package-archive.json`
- `package.zip`
- `ontology/index.json`
- `knowledge-objects/index.json`
- `graph/relationships.json`
- `sources/index.json`
- `governance/index.json`
- `runtime/config.json`
- `prompts/index.json`
- `rules/index.json`
- `formulas/index.json`
- `cases/index.json`
- `workflows/index.json`
- `templates/index.json`

The individual JSON files are the canonical local export artifacts. `package-archive.json` is an inspectable bundled JSON representation. `package.zip` is the pilot handoff archive.

---

## 3. Incremental Package Update Strategy

Current Sprint 6 behavior is confirmed replace-by-version:

1. The package ID is derived from project name and version.
2. Re-assembling the same draft version requires explicit replacement confirmation.
3. Creating a new version should produce a new package ID and export folder.
4. Confirmed same-version replacement rewrites the local export files and increments the package replacement sequence.
5. Publishing a package marks that version immutable.
6. A published package cannot be overwritten; create a new version instead.

Near-term hardening:

- Expand package diff summary from file-level changes to semantic package changes.
- Add runtime/browser verification for persisted package governance exports.

---

## 4. Release Approval Workflow

Draft assembly and publication are separate governance steps.

Current package release states:

1. `draft` - package files can be assembled or replaced while governance blockers are clear.
2. `under_review` - a reviewer has submitted the package for release approval.
3. `changes_requested` - release review found corrections; the package can be repaired and resubmitted.
4. `approved` - a publisher has approved the package for immutable publication.
5. `published` - the package export is immutable and retained for handoff/runtime use.
6. `rejected` - release review stopped the package; replace the draft package version or create a new version before resubmission.

Publication requires `approved` status. A draft package cannot be published directly.

Reviewer and publisher notes are recorded as package audit history for these actions:

- `pka_package.assembled`
- `pka_package.replaced`
- `pka_package.under_review`
- `pka_package.changes_requested`
- `pka_package.approved`
- `pka_package.published`
- `pka_package.rejected`

The exported `governance/index.json` includes:

- `releaseDecisionSummary` with package version, release status, replacement lineage, publish date, and release decision events,
- recent governance events for inspection and traceability.

Package assembly, release review, approval, rejection, and publication refresh the persisted package files under `storage/exports/<packageId>`, including `governance/index.json`, `package-archive.json`, and `package.zip`.

The PKA Builder shows the current release gate state, latest package decision history, version lineage, and published export retention status.

---

## 5. Published Export Retention

Published package exports are retained under:

```text
storage/exports/<packageId>
```

Published package versions cannot be overwritten by draft assembly. Same-version assembly remains available only before publication and requires explicit replacement confirmation. After publication, corrections or improvements must use a new package version and therefore a new package ID/export folder.

---

## 6. Base PKA Boundary

A Base PKA should include governed professional knowledge and the metadata required to inspect, retrieve, validate, and cite it.

Base PKA includes:

- approved or release-grade Knowledge Objects,
- ontology and controlled vocabulary,
- relationship graph edges,
- source reference index,
- governance and review evidence,
- package manifest and component index,
- placeholder component indexes for runtime config, prompts, rules, formulas, cases, workflows, and templates until those records are implemented.

Base PKA excludes runtime/client state:

- client books, transactions, ledgers, project ledgers, or operational records,
- user conversations, chat memory, runtime session history, and temporary retrieval context,
- local vector caches, embeddings caches, model output caches, and ranking telemetry,
- client-specific overrides, private adaptation notes, and client approval records,
- runtime credentials, provider API keys, tokens, secrets, and environment configuration,
- app-specific UI state, notifications, task queues, and execution logs,
- LADOS/AIFA tenant data and runtime vault state.

Those exclusions belong to a runtime vault, client-adapted PKA instance, or consuming application database.

---

## 7. Relationship Evidence Decision

Relationship source evidence remains stored as structured `KnowledgeRelationship.provenance.sourceEvidence` for the pilot.

Decision: do not create a dedicated relationship evidence table yet.

Do not promote it to a dedicated table until export and review feedback shows one of these needs:

- multiple source evidence links per relationship,
- independent relationship evidence review lifecycle,
- relationship evidence versioning,
- separate package index for graph evidence,
- richer citation/locator semantics than the current provenance structure supports.

---

**End of PKA Export Strategy**

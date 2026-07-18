# PKA Package Installer Contract for Runtime Apps

**Status:** Active implementation guidance  
**Date:** 2026-07-17  
**Audience:** AIFA, LADOS, and future runtime app developers

---

## 1. Purpose

This note defines the minimum installer contract a runtime app should apply before loading a Knowledge Factory Base PKA.

Knowledge Factory manufactures governed Professional Knowledge Assets. Runtime products such as AIFA and LADOS install, retrieve, and apply those assets inside their own runtime boundaries. A runtime installer must therefore fail closed when a package is malformed, under-governed, or requires capabilities the runtime does not support.

---

## 2. Minimum Install Decision

A runtime installer should produce one of these decisions:

- `installable` - the package can be loaded by the runtime.
- `blocked` - the package must not be loaded.
- `installation_review_required` - the package can be inspected, but a human or runtime owner must approve or configure missing capability support before use.

The current KF local harness maps these into `importable` and `blocked`. AIFA and LADOS may add `installation_review_required` when their product workflow needs a review queue.

---

## 3. Required Checks

Before loading a Base PKA, the runtime installer should verify:

- archive parses as a KF JSON archive,
- `manifest.json` exists,
- required runtime capabilities are supported or explicitly routed to installation review,
- `ontology/index.json` exposes object and relationship vocabulary,
- `knowledge-objects/index.json` is present,
- `graph/relationships.json` is present,
- `sources/index.json` is present,
- `runtime/config.json` is present as a runtime configuration boundary,
- placeholder component indexes are present for `prompts/`, `rules/`, `workflows/`, and `templates/`,
- `governance/index.json` includes release decision summaries,
- package content is not treated as runtime/client state.

---

## 4. AIFA Installer Example

AIFA should keep bookkeeping transactions, ledgers, chat memory, and client-specific learning outside the Base PKA.

Example blocked install:

```json
{
  "packageId": "pka-finance-bookkeeping-0-1-0",
  "decision": "blocked",
  "missingOrUnsupportedCapabilities": ["bank_feed_reconciliation_runtime"],
  "runtimeAction": "Do not install. Ask the package publisher for a compatible package or enable the missing runtime capability."
}
```

Example review install:

```json
{
  "packageId": "pka-finance-tax-guidance-0-1-0",
  "decision": "installation_review_required",
  "reason": "The package includes tax workflow placeholders. AIFA can inspect guidance, but must not execute workflow behavior until reviewed."
}
```

---

## 5. LADOS Installer Example

LADOS can support broader workflow and orchestration behavior, but it should still separate Base PKA content from project facts, user permissions, mission state, and client vault state.

Example blocked install:

```json
{
  "packageId": "pka-qs-rfq-from-boq-0-1-0",
  "decision": "blocked",
  "reason": "governance/index.json is missing release decision summaries."
}
```

Example review install:

```json
{
  "packageId": "pka-qs-rfq-from-boq-0-1-0",
  "decision": "installation_review_required",
  "missingOrUnsupportedCapabilities": ["workflow_execution"],
  "runtimeAction": "Allow knowledge inspection only. Do not expose workflow execution until capability support is configured."
}
```

---

## 6. Local KF Harness

The local KF Studio harness is:

```text
/runtime-import
```

The consuming-app handoff readback surface is:

```text
/runtime-handoff
```

It loads `runtime/app-developer-handoff.json`, maps package handoff checks into `installable`, `blocked`, or `installation_review_required`, and keeps relationship-evidence table feedback visible before a consuming app turns package content into runtime behavior.

The handoff surface also creates deterministic negative handoff fixtures for installer developers:

| Fixture | Expected decision | Purpose |
| --- | --- | --- |
| `runtime/app-developer-handoff-missing-required-file.json` | `blocked` | Proves the runtime must fail closed when a handoff-required package file is absent. |
| `runtime/app-developer-handoff-review-required.json` | `installation_review_required` | Proves policy-only warnings can be routed to runtime-owner review without treating the package as fully installable. |

The handoff surface records pilot consuming-app feedback as package governance history. For the QS/RFQ pilot, this is the accepted persistence decision:

- use audit-backed feedback records now,
- keep relationship evidence in `KnowledgeRelationship.provenance.sourceEvidence` after a single multi-source lifecycle request and mark it for monitoring,
- start dedicated relationship evidence record design only after two or more independent pilot consumers request multi-source relationship evidence lifecycle,
- promote to a dedicated app-developer review table or relationship-evidence table only after repeated pilot feedback proves that the audit-backed model is too thin.

It validates selected persisted package archives and safe imported JSON archives under:

```text
storage/exports/<packageId>/imports/
```

It records import decisions as governance history events:

- `runtime_import.importable`
- `runtime_import.blocked`

The harness exposes decision drilldowns for all/importable/blocked outcomes and deterministic fixtures for:

- valid package archive,
- missing governance summary,
- malformed archive,
- unsupported runtime capability mismatch,
- missing prompt component index,
- missing rule component index,
- missing workflow component index,
- missing template component index.

This harness is a contract test for runtime developers. It is not a substitute for AIFA or LADOS runtime installation, permissions, tenant isolation, vault state, or execution engines.

The consuming-app handoff surface now also exposes a generic Runtime Consumption Contract report. The report applies the same published package and handoff file to multiple runtime profiles:

- Generic PKA runtime.
- AIFA mobile app.
- LADOS runtime.

Each profile records:

- install decision,
- supported capabilities,
- required package capabilities,
- unsupported capabilities,
- runtime/client-state boundary,
- installer checklist,
- next action.

A package can therefore be installable for one runtime and `installation_review_required` for another without changing the Base PKA. For example, the QS/RFQ validation article is suitable for LADOS inspection, while AIFA should route it to installation review because it is outside the finance/bookkeeping runtime domain.

---

## 7. QS/RFQ Pilot Package Readback Checklist

For the QS/RFQ from BOQ pilot package, an AIFA/LADOS-style runtime developer should inspect these files before treating the package as installable:

| File | Runtime expectation |
| --- | --- |
| `manifest.json` | Confirms package identity, version, domain, governance status, object/relationship vocabulary, and required runtime capabilities. |
| `knowledge-objects/index.json` | Contains approved Knowledge Objects only; runtime apps should not load draft or under-review records as authoritative guidance. |
| `graph/relationships.json` | Contains governed relationship edges for retrieval/traversal. Relationship evidence remains in structured provenance for the pilot. |
| `sources/index.json` | Lists source references available for citation and evidence traceability. |
| `sources/rfq-evidence-register.json` | Provides the structured RFQ evidence register used to assess package issue readiness. |
| `governance/index.json` | Must include `releaseDecisionSummary`, `rfqEvidenceDecisionSummary`, `rfqWorkflowGateSummary`, `rfqWorkflowGateActionSummary`, and `rfqWorkflowGateActionRisk`. |
| `workflows/rfq-package-issue-workflow.json` | Defines the pilot RFQ package issue workflow boundary; it is not yet a full runtime workflow engine. |
| `runtime/app-developer-handoff.json` | Gives the concise handoff index and runtime integration notes for app developers. |
| `runtime/config.json`, `prompts/index.json`, `rules/index.json`, `workflows/index.json`, `templates/index.json` | Placeholder component boundaries must be present even when not executable yet. |

Blocked RFQ workflow actions are a publish-time failure in KF. If a runtime receives a package with `rfqWorkflowGateActionRisk.blockedCount > 0`, treat it as `blocked` or `installation_review_required` and ask for a corrected package. Overdue actions are not automatically invalid, but they must be shown to the runtime owner because they indicate unresolved time-sensitive commercial follow-up.

Relationship evidence table decision for the pilot:

- Do not expect a dedicated relationship evidence table or file yet.
- Read relationship source evidence from `graph/relationships.json` provenance fields.
- Request a dedicated relationship evidence component only if the runtime needs multi-source evidence sets, independent relationship-evidence review lifecycle, or separate graph-evidence indexing.

---

## 8. Ollama Boundary

Ollama or another local model provider should not be required for package installation.

The installer must first validate package structure, governance, component boundaries, and runtime capabilities deterministically. AI-assisted retrieval, explanation, or installer support can be added later after the deterministic path remains stable.

---

**End of PKA Package Installer Contract**

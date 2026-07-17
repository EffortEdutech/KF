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

---

## 7. Ollama Boundary

Ollama or another local model provider should not be required for package installation.

The installer must first validate package structure, governance, component boundaries, and runtime capabilities deterministically. AI-assisted retrieval, explanation, or installer support can be added later after the deterministic path remains stable.

---

**End of PKA Package Installer Contract**

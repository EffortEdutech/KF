# PKA Anatomy and Runtime Boundary

**Date:** 2026-07-15  
**Status:** Active implementation architecture note  
**Baseline:** `docs/v1` Version 1.0 frozen architecture  
**Related notes:** `Shared Discussion Architecture Review - CFO Package for LADOS.md`

---

## 1. Purpose

This document clarifies what Knowledge Factory manufactures and where the boundary sits between:

- Knowledge Factory,
- Professional Knowledge Assets,
- runtime products such as AIFA and LADOS,
- AI models,
- client-owned business data.

The goal is to keep KF, AIFA, and LADOS aligned before Sprint 1 implementation expands the data model and user workflows.

---

## 2. Core Product Definition

Knowledge Factory manufactures **Professional Knowledge Assets**.

A Professional Knowledge Asset, or PKA, is a governed, versioned, installable package of professional intelligence. It is not merely a document, prompt library, chatbot, database, or AI model.

In implementation terms:

```text
Trusted Sources
      |
      v
Knowledge Factory
      |
      v
Governed Knowledge Objects + Components
      |
      v
Professional Knowledge Asset Package
      |
      v
Runtime Product or Runtime Harness
```

The PKA is the product shipped by Knowledge Factory. Runtime applications use it.

---

## 3. PKA Anatomy

A PKA has three major layers.

### 3.1 Package Identity Layer

This layer identifies the package and its release conditions.

Required concerns:

- package ID,
- package name,
- domain,
- version,
- publisher,
- created date,
- updated date,
- governance status,
- license or usage policy,
- required runtime capabilities.

### 3.2 Professional Knowledge Layer

This layer contains the professional intelligence.

Core contents:

- Knowledge Objects,
- ontology,
- graph relationships,
- source reference index,
- rules,
- workflows,
- templates,
- formula or model definitions,
- prompt and instruction libraries,
- case examples or historical patterns,
- known limitations.

Knowledge Objects remain the core unit. Other package contents may be modeled as Knowledge Objects, Knowledge Asset Components, or both, depending on the implementation need.

### 3.3 Governance Layer

This layer records why the PKA can be trusted.

Required concerns:

- source traceability,
- reviewer identity,
- approval status,
- approval date,
- version history,
- change history,
- confidence or readiness signals,
- deprecation notices,
- audit events.

No unapproved draft knowledge should be exported or served as production-ready knowledge.

---

## 4. Knowledge Asset Components

A PKA is a package-level asset composed of smaller governed components.

Initial component kinds:

- `knowledge_object`
- `ontology`
- `relationship_graph`
- `source_reference_index`
- `rule`
- `workflow`
- `template`
- `formula`
- `prompt_library`
- `case_library`
- `runtime_configuration`
- `governance_record`

Component-level modeling matters because a runtime product may need to update a rule, template, workflow, or ontology slice without treating the whole domain PKA as conceptually new.

The first MVP can still export one package folder. The architecture should preserve the path to modular and incremental updates.

---

## 5. Base PKA vs Client-Adapted PKA Instance

A key distinction is required for AIFA, LADOS, and future products.

### Base PKA

A Base PKA is manufactured and governed by Knowledge Factory.

Examples:

- Finance PKA,
- QS/RFQ from BOQ PKA,
- Construction Claims PKA,
- Civil Engineering QA/QC PKA.

It contains professional knowledge, rules, workflows, templates, and governance metadata that can be reused across organizations.

### Client-Adapted PKA Instance

A Client-Adapted PKA Instance is a runtime-local adaptation of a Base PKA.

It may include:

- client configuration,
- enabled workflows,
- local thresholds,
- organization-specific policies,
- user preferences,
- runtime learning approved by the client,
- references to client business records.

It should not silently rewrite the Base PKA. Client adaptations must be traceable, permissioned, and versioned separately.

---

## 6. Local Vault Boundary

A runtime product such as AIFA may maintain a Local PKA Vault.

The vault may contain:

- installed Base PKA packages,
- client-adapted PKA instance data,
- runtime configuration,
- encrypted business data,
- documents,
- indexes,
- workflow state,
- AI memory or interaction history,
- user preferences.

Not everything in the vault is manufactured by Knowledge Factory.

Boundary rule:

```text
KF manufactures governed PKA packages.
Runtime products own runtime state, business records, and client-local adaptations.
```

When runtime learning becomes reusable professional knowledge, it must return to a governed KF process before it becomes part of a published Base PKA.

---

## 7. Runtime Boundary

Knowledge Factory should not duplicate the runtime product.

KF owns:

- source capture,
- Knowledge Object creation,
- ontology design,
- graph creation,
- rule/template/workflow packaging,
- provenance,
- review,
- approval,
- publishing,
- PKA versioning.

Runtime products own:

- user interaction,
- local execution,
- workflow execution,
- AI interaction experience,
- business transaction handling,
- client data storage,
- tool integration,
- runtime state,
- installed PKA loading.

Runtime products may include a PKA Runtime Engine. In AIFA, that runtime engine is the heart of the mobile product. In LADOS, the runtime sits within the broader mission, workflow, AI, graph, and resource engines.

---

## 8. Runtime Knowledge Service Boundary

In addition to exporting packages, KF may later expose a Runtime Knowledge Service.

The service can answer approved-knowledge queries from AIFA, LADOS, or another authorized runtime.

It must:

- serve only approved or published knowledge unless explicitly operating in a review context,
- preserve source and governance references,
- respect organization permissions,
- avoid exposing secrets or unauthorized business data,
- return uncertainty when evidence is insufficient,
- remain model-provider independent.

The Runtime Knowledge Service is not a replacement for runtime engines. It is a governed knowledge boundary.

---

## 9. AIFA Alignment

AIFA is a runtime product that uses financial professional intelligence.

Aligned relationship:

```text
Knowledge Factory
  manufactures Finance PKA

Finance PKA
  structures professional finance knowledge

AIFA PKA Runtime Engine
  loads and applies the Finance PKA

AIFA mobile experience
  captures user intent and presents assistance

Business data
  provides client-specific context

AI model
  provides reasoning and communication capability
```

Therefore:

- AIFA does not replace KF.
- AIFA should not be the canonical authoring tool for Base PKA knowledge.
- AIFA may create runtime learning, but promotion into a Base PKA requires KF governance.
- The Finance PKA must remain portable across model providers and runtime environments.

---

## 10. LADOS Alignment

LADOS is a runtime and orchestration platform.

Aligned relationship:

```text
Knowledge Factory
  manufactures and publishes PKA packages

LADOS Studio
  uses published PKAs to build operational solutions

LADOS Runtime
  installs, loads, executes, and operationalizes PKAs
```

KF should export enough package structure for LADOS to:

- read metadata,
- load ontology,
- load Knowledge Objects,
- load relationships,
- load prompts,
- load rules,
- load workflows,
- verify governance status,
- check runtime capability requirements.

---

## 11. Sprint 0/1 Implementation Rules

For the current implementation:

- Keep `packages/pka` as the PKA package contract boundary.
- Keep `packages/core` as the lifecycle, Mission, role, relationship, and shared domain contract boundary.
- Do not put runtime product logic into KF packages.
- Model PKA packages separately from runtime vault state.
- Preserve Base PKA vs Client-Adapted PKA Instance vocabulary in docs and future schema design.
- Treat the QS/RFQ from BOQ pilot as a Base PKA proof of concept first.

---

## 12. Open Implementation Questions

These are not blockers for Sprint 1, but they must be answered before Sprint 6 export work:

- Are all package components stored as Knowledge Objects, or do some receive dedicated component tables?
- What is the first manifest shape for component indexes?
- How should a runtime declare a local adaptation of a Base PKA?
- How are incremental PKA updates signed, validated, or compared?
- Which client-side runtime learning can be promoted back into KF?
- What is the minimum Runtime Knowledge Service query/response contract?

---

## 13. Decision

Accepted for implementation planning:

- Knowledge Factory manufactures PKA packages.
- A PKA is a package-level governed asset composed of smaller knowledge components.
- Runtime products load and apply PKAs, but own their runtime state and client business data.
- Base PKAs and client-adapted PKA instances must be distinguished.
- A future Runtime Knowledge Service may serve approved knowledge, but it must not duplicate AIFA or LADOS runtime engines.

**End of Note**

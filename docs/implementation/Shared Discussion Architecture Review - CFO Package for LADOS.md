# Shared Discussion Architecture Review - CFO Package for LADOS

**Date reviewed:** 2026-07-14  
**Source:** https://chatgpt.com/share/6a560cc3-10d4-83ec-be47-c33f1dd7dac7  
**Discussion title:** CFO package for LADOS  
**Status:** Implementation architecture input, not a replacement for the frozen `docs/v1` baseline

---

## 1. Purpose

This note records the architecture implications from the shared CFO/LADOS discussion.

The frozen Version 1 Knowledge Factory documentation remains authoritative. This note only clarifies implementation planning where the shared discussion sharpens or extends the current Sprint 0/Sprint 1 structure.

---

## 2. Main Architecture Reading

The discussion reinforces the manufacturer-runtime model:

- Knowledge Factory manufactures governed professional knowledge.
- LADOS Studio uses published professional knowledge packages to create operational solutions.
- LADOS Runtime executes the resulting workflows, missions, dashboards, reports, alerts, assistants, and actions.
- In local corporate deployment, Knowledge Factory and LADOS may run concurrently on the same corporate AI environment while keeping separate responsibilities.

This is consistent with `docs/v1/TRY 1/Volume G - LADOS Runtime Integration.md` and `docs/v1/KF 5_1 - LADOS and PKA Runtime Integration.md`.

---

## 3. New Clarifications to Carry Forward

### 3.1 Knowledge Factory Has Two Operating Modes

The discussion separates two modes that should be reflected in planning:

1. **Factory Mode / Knowledge Manufacturing**
   - captures source material,
   - extracts and structures knowledge,
   - creates Knowledge Objects, rules, templates, ontologies, graph relationships, and case libraries,
   - routes knowledge through human governance,
   - publishes governed PKA packages.

2. **Runtime Knowledge Service**
   - serves approved knowledge to LADOS or another runtime,
   - answers runtime knowledge requests using current governed knowledge,
   - remains bounded by publication, governance, and provenance rules.

Sprint implication: do not build a full LADOS runtime inside KF, but keep a clean service/interface boundary so LADOS can later query approved KF knowledge as well as load exported packages.

### 3.2 PKA Should Be Treated as a Package-Level Asset

The discussion usefully distinguishes package-level PKAs from their smaller internal components.

The frozen docs already define a PKA as an installable package of governed professional knowledge. Implementation should make that explicit:

- a PKA package is composed of smaller governed knowledge assets/components,
- examples include Knowledge Objects, decision rules, ontology terms, templates, formula libraries, prompt libraries, graph relationships, case libraries, and workflow definitions,
- components should be versionable and updateable without requiring a full conceptual rebuild of the whole domain package.

Sprint implication: `packages/pka` should evolve from a manifest-only contract into a package/component manifest contract. The current `PkaManifest` is still valid as the package manifest root.

### 3.3 LADOS Consumes Published Knowledge, Not Draft Knowledge

The discussion strongly reinforces the approval boundary:

- draft and AI-generated material belongs inside KF,
- expert validation and approval happen before production use,
- LADOS should consume published packages or approved runtime knowledge responses.

Sprint implication: the canonical lifecycle states and runtime contract must prevent unapproved knowledge from being exported or served as production-ready knowledge.

### 3.4 Corporate Local Deployment Remains Important

The discussion assumes a corporate AI environment where sensitive organization knowledge remains local/private unless explicitly configured otherwise.

Sprint implication: the standalone-first scaffold remains acceptable, but provider/model routing, local storage, and future Ollama/local-model support are not optional architecture luxuries. They are part of the trust model.

---

## 4. Impact on Current Scaffold

The current Sprint 0 scaffold is aligned with the shared discussion:

- `apps/studio` can remain the standalone-first Studio shell.
- `packages/core` is the right place for lifecycle, Mission, role, and relationship contracts.
- `packages/pka` is correctly named as the PKA packaging boundary.
- `packages/ai` keeps model/provider decisions abstracted.
- `packages/db` and relational graph tables remain suitable for the MVP.

No framework or package manager correction is required.

Required planning adjustments:

- add explicit Runtime Knowledge Service as a future service boundary,
- add package-component vocabulary to PKA planning,
- ensure Sprint 6 PKA export supports component-level package structure,
- ensure Sprint 8 validates both package loading and the future query-service contract shape,
- keep LADOS integration as a consumer boundary, not a reason to duplicate LADOS runtime engines inside KF.

---

## 5. Recommended Architecture Vocabulary

Use this vocabulary in active implementation docs:

- **Knowledge Source:** raw trusted input such as standards, SOPs, reports, BOQs, expert interviews, historical cases, and templates.
- **Knowledge Object:** core governed unit of structured knowledge.
- **Knowledge Asset Component:** smaller packageable component such as a rule, template, formula, prompt, case, graph edge set, ontology slice, workflow definition, or KO collection.
- **Professional Knowledge Asset / PKA Package:** installable governed package composed of Knowledge Objects and Knowledge Asset Components.
- **Knowledge Solution:** LADOS-built operational application, workflow, dashboard, report, mission flow, or assistant behavior that uses published PKA knowledge.
- **Runtime Knowledge Service:** future KF-facing service boundary through which LADOS can query approved/published knowledge without bypassing governance.

---

## 6. Sprint-Level Corrections

### Sprint 0

Record this review and preserve the current standalone-first, LADOS-compatible boundary decision.

### Sprint 1

When source and project management begins, make source categories broad enough to support professional packages such as CFO/Finance or QS/RFQ:

- standards,
- SOPs,
- company documents,
- expert interviews,
- historical cases,
- analytical models,
- templates,
- market/external data references.

### Sprint 2

Keep Knowledge Objects as the core unit, but avoid modeling all future package contents as only one object type. Rules, templates, formulas, cases, and workflow definitions may be Knowledge Objects or asset components depending on implementation fit.

### Sprint 6

Expand PKA Builder planning to include package components and incremental package updates.

### Sprint 8

Extend the LADOS-compatible harness to validate:

- package import,
- runtime capability requirements,
- approved-knowledge-only behavior,
- the shape of a future Runtime Knowledge Service contract.

### Sprint 9

The QS/RFQ from BOQ pilot remains a good first domain. The CFO package discussion is still valuable as a pattern for later finance-domain PKAs.

---

## 7. Conclusion

The shared discussion does not overturn the Sprint 0 architecture. It sharpens it.

The main correction is to plan KF as both:

- a governed knowledge manufacturing system, and
- a future approved-knowledge service for LADOS,

while keeping package export as the first practical integration path.

**End of Review**

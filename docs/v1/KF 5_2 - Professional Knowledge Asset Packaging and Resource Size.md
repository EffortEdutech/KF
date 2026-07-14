# Knowledge Factory (KF)

## KF 5_2 - Professional Knowledge Asset Packaging and Resource Size

**Version:** 1.0 (Strategic Extension)

---

# Chapter 1 - Purpose

This document captures the practical sizing and packaging principles for Professional Knowledge Assets, using a Civil Engineering PKA as the reference example.

The key conclusion is that a PKA is mostly structured knowledge, not a large AI model. A capable professional PKA can therefore remain much smaller than expected if designed modularly.

---

# Chapter 2 - Civil Engineering PKA Size Estimate

A realistic Civil Engineering PKA may contain the following components:

| Component | Estimated Size |
| --- | ---: |
| Ontology, concepts, and relationships | 20-100 MB |
| Knowledge graph | 100-500 MB |
| Workflows | 20-100 MB |
| Rules and reasoning library | 20-80 MB |
| Templates, checklists, and forms | 50-300 MB |
| Standards metadata and indexes | 50-200 MB |
| Vector embeddings | 300 MB-2 GB |
| Images, diagrams, and reference illustrations | 1-10 GB |
| AI prompt library | <10 MB |
| Configuration and metadata | <50 MB |

Estimated package sizes:

- Lite Edition: 1-3 GB.
- Professional Edition: 5-15 GB.
- Enterprise Edition: 20-50 GB.

---

# Chapter 3 - Largest Storage Drivers

The largest storage consumers are usually not ontologies or workflows.

The largest components are:

- Images.
- Engineering drawings.
- PDFs.
- Vector embeddings.
- Large reference libraries.

Structured knowledge is relatively compact:

- 10,000 engineering concepts may occupy only a few tens of megabytes.
- Millions of relationships can fit within a few hundred megabytes when stored efficiently.
- Thousands of workflows remain compact because they are structured JSON or graph definitions.

---

# Chapter 4 - Modular PKA Packaging

Civil Engineering should not be shipped as one oversized package.

The preferred model is a layered package architecture:

```text
Civil Engineering Core PKA
        |
        +-- Structures PKA
        +-- Geotechnical PKA
        +-- Roads PKA
        +-- Bridges PKA
        +-- Hydraulics PKA
        +-- Concrete Design PKA
        +-- Construction QA/QC PKA
        +-- BIM Extension
```

Users install only the modules they need.

This keeps installation smaller, simplifies upgrades, and allows domain-specific modules to evolve independently.

---

# Chapter 5 - Incremental Updates

PKAs should support incremental updates rather than requiring full package downloads.

Example update sizes:

- New bridge design workflow: 5 MB.
- Updated regulation: 2 MB.
- New ontology terms: 1 MB.
- New rule library: 20 MB.

This keeps maintenance practical for organizations with many installed PKAs.

---

# Chapter 6 - AI Model Exclusion

The PKA should not include the large language model itself.

Instead, a PKA contains:

- Ontology.
- Knowledge graph.
- Reasoning rules.
- Workflows.
- Prompt templates.
- Validation rules.
- Metadata.

LADOS provides the runtime and connects to the configured AI model, whether local or cloud-based.

This keeps PKAs portable and prevents duplication of AI models across domains.

---

# Chapter 7 - Installable Knowledge Package

A PKA should be treated less like a simple ZIP file and more like an installable software package.

For example:

```text
Civil Engineering Professional Pack
v1.4.2

Contains:
- Ontology
- Knowledge Graph
- Workflows
- AI Workers
- Rule Engine
- Templates
- Calculators
- Forms
- Dashboards
- Validation Rules
- Learning Resources
- Mission Templates
```

When installed into LADOS, the package should automatically register its components with:

- Knowledge Runtime.
- Workflow Engine.
- Graph Engine.
- Mission Engine.
- Intelligence Engine.

---

# Chapter 8 - Strategic Principle

PKAs should be portable, modular, versioned, and incrementally updateable.

They should carry professional knowledge and executable behavior, but not duplicate the runtime or AI model.

---

**End of KF 5_2**

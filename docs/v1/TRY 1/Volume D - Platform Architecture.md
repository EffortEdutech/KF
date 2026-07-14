# Knowledge Factory

## Volume D - Platform Architecture

**Version:** 1.0 (Architecture Baseline)

---

# 1. Architecture Vision

Knowledge Factory is a modular platform for manufacturing governed Professional Knowledge Assets.

The architecture has seven major layers:

```text
Knowledge Factory Studio
        |
Application Services
        |
Knowledge Manufacturing Pipeline
        |
Intelligence Engine
        |
Knowledge Object Repository
        |
Governance and Packaging Layer
        |
Runtime Integration Layer
```

---

# 2. Studio Layer

The Studio layer provides the user interface for:

- Project management.
- Source management.
- Knowledge Object editing.
- Pipeline monitoring.
- Review and approval.
- Graph inspection.
- PKA packaging.
- AI testing.

---

# 3. Application Services

Application services coordinate the product capabilities.

Core services include:

- Identity Service.
- Project Service.
- Source Service.
- Knowledge Object Service.
- Ontology Service.
- Graph Service.
- Pipeline Orchestration Service.
- Review Service.
- PKA Packaging Service.
- AI Provider Service.

---

# 4. Knowledge Manufacturing Pipeline

The pipeline converts raw professional material into governed knowledge.

Core pipeline stages:

```text
Source Material
      |
Ingestion
      |
Extraction
      |
Classification
      |
Knowledge Object Creation
      |
Relationship Mapping
      |
AI Enrichment
      |
Human Review
      |
Approval
      |
PKA Packaging
```

---

# 5. Intelligence Engine

The Intelligence Engine supports the pipeline with AI capabilities.

Responsibilities:

- Parse and summarize source content.
- Suggest Knowledge Objects.
- Suggest object types.
- Suggest relationships.
- Generate draft explanations.
- Retrieve relevant evidence.
- Support question answering.
- Run validation checks.
- Use local or remote models through a provider abstraction.

The Intelligence Engine does not replace governance. It accelerates preparation and review.

---

# 6. Knowledge Object Repository

The repository stores all structured knowledge.

It should support:

- Relational metadata.
- Object content.
- Source evidence.
- Version history.
- Governance status.
- Graph relationships.
- Embeddings for retrieval.
- Exportable package records.

The repository is the source of truth for Knowledge Factory projects.

---

# 7. Governance Layer

The governance layer ensures that knowledge assets remain reliable.

It manages:

- Review states.
- Approval workflow.
- Versioning.
- Traceability.
- Deprecation.
- Release readiness.
- Audit history.

---

# 8. Packaging Layer

The packaging layer builds Professional Knowledge Assets.

It assembles:

- PKA manifest.
- Knowledge Objects.
- Ontology.
- Graph relationships.
- Source references.
- Prompt libraries.
- Rules.
- Runtime configuration.
- Governance metadata.

---

# 9. Runtime Integration Layer

The runtime integration layer allows a PKA to be installed or executed by external platforms.

Version 1 should focus on compatibility with LADOS as the main runtime target.

This layer should support:

- Package export.
- Manifest validation.
- Runtime capability metadata.
- Import test harness.
- API-based handoff.

---

# 10. Storage Architecture

The local-first development architecture may use:

- PostgreSQL for structured project data.
- pgvector for embeddings.
- Neo4j or a graph layer for relationship exploration.
- Redis for queues and temporary processing state.
- MinIO for object storage.
- Local file storage for development artifacts.

---

# 11. Architectural Principle

Knowledge Factory manufactures knowledge assets.

LADOS or another runtime executes those assets.

This separation keeps the architecture clean:

- Knowledge Factory owns creation, curation, governance, and packaging.
- Runtime platforms own execution, user interaction, workflow running, and integration.

---

**End of Volume D**

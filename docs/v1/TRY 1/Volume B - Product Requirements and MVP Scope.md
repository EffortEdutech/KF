# Knowledge Factory

## Volume B - Product Requirements and MVP Scope

**Version:** 1.0 (Architecture Baseline)

---

# 1. Product Definition

Knowledge Factory Version 1 is a web platform for creating, managing, validating, and packaging Professional Knowledge Assets.

The MVP must allow a user to move from raw professional material to a governed, AI-ready knowledge package.

---

# 2. Primary User Roles

## Knowledge Architect

Designs the structure of a knowledge domain, including ontology, categories, relationships, and asset boundaries.

## Domain Expert

Provides expert knowledge, validates extracted knowledge, reviews rules, and approves professional accuracy.

## Knowledge Engineer

Configures pipelines, object schemas, workflows, embeddings, graph relationships, and PKA package structure.

## Reviewer or Approver

Checks quality, governance status, version readiness, and release approval.

## Runtime Consumer

Uses the resulting PKA inside LADOS or another compatible runtime.

---

# 3. Core MVP Capabilities

The MVP shall include:

- Project workspace creation.
- Knowledge source upload.
- Knowledge Object creation.
- Knowledge Object repository.
- Knowledge Manufacturing Pipeline.
- Basic ontology and relationship management.
- AI-assisted extraction and summarization.
- Human review and approval workflow.
- PKA package creation.
- Export or install-ready package output.
- Local AI configuration using Ollama.

---

# 4. Knowledge Source Management

The platform shall support importing and organizing professional source materials such as:

- PDF documents.
- Word documents.
- Markdown files.
- Spreadsheets.
- Standard operating procedures.
- Templates.
- Checklists.
- Project records.
- Lessons learned.
- Manual notes.

Each source shall retain metadata including:

- Title.
- Source type.
- Owner.
- Version.
- Date added.
- Review status.
- Related domain.
- Related Knowledge Objects.

---

# 5. Knowledge Object Requirements

A Knowledge Object is the smallest governed unit of reusable professional knowledge.

Each Knowledge Object shall support:

- Unique identifier.
- Name.
- Description.
- Type.
- Domain.
- Source references.
- Tags.
- Related objects.
- Status.
- Version.
- Confidence level.
- Human approval status.

Common Knowledge Object types include:

- Concept.
- Procedure.
- Rule.
- Standard.
- Checklist.
- Template.
- Workflow step.
- Decision point.
- Calculation method.
- Risk.
- Evidence item.
- Example.

---

# 6. Knowledge Manufacturing Pipeline Requirements

The MVP pipeline shall support these stages:

1. Ingest source material.
2. Extract candidate knowledge.
3. Classify into Knowledge Object types.
4. Link to source evidence.
5. Suggest relationships.
6. Generate summaries and usage notes.
7. Submit for human review.
8. Approve or reject.
9. Publish into the repository.
10. Package into a PKA.

---

# 7. Professional Knowledge Asset Requirements

The MVP shall produce a Professional Knowledge Asset package that includes:

- Manifest.
- Domain metadata.
- Knowledge Object collection.
- Relationship graph.
- Source reference index.
- Prompt or instruction library.
- Runtime configuration.
- Governance metadata.
- Version information.

The package does not need to include every future marketplace feature, but it must be structured enough to be installed, inspected, and executed by a compatible runtime.

---

# 8. AI Requirements

The MVP Intelligence Engine shall support:

- Text extraction assistance.
- Summarization.
- Knowledge Object suggestion.
- Relationship suggestion.
- Retrieval-augmented question answering.
- Draft validation comments.
- Local model support through Ollama.
- Provider abstraction for future model changes.

AI output must remain draft status until reviewed where professional accuracy matters.

---

# 9. Governance Requirements

The platform shall support:

- Draft status.
- Review status.
- Approved status.
- Deprecated status.
- Version history.
- Reviewer notes.
- Source traceability.
- Change log.

No PKA should be released as approved unless its required Knowledge Objects have passed governance checks.

---

# 10. Out of Scope for Version 1

The following are not required for the first MVP:

- Public marketplace launch.
- Enterprise multi-tenant billing.
- Complex workflow automation runtime.
- Full LADOS feature replacement.
- Native mobile apps.
- Advanced collaborative editing.
- Full visual node programming.
- Complex role-based enterprise administration.

These may be future capabilities after the core manufacturing loop is proven.

---

# 11. MVP Success Criteria

The MVP is successful when a team can:

1. Create a Knowledge Factory project.
2. Add professional source material.
3. Generate Knowledge Object candidates.
4. Review and approve those objects.
5. Build a relationship graph.
6. Ask grounded questions against approved knowledge.
7. Export a PKA package.
8. Demonstrate the PKA inside a compatible runtime or local test harness.

---

**End of Volume B**

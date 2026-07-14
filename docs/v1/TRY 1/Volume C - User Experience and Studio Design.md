# Knowledge Factory

## Volume C - User Experience and Studio Design

**Version:** 1.0 (Architecture Baseline)

---

# 1. Studio Concept

Knowledge Factory Studio is the primary workspace for building Professional Knowledge Assets.

The Studio should feel like a professional production environment for knowledge, not a chat application and not a file manager.

Its job is to help users see:

- What knowledge has been collected.
- What knowledge has been extracted.
- What has been approved.
- What is missing.
- What relationships exist.
- What is ready for packaging.

---

# 2. Primary Navigation

The Studio should include these main areas:

- Dashboard.
- Sources.
- Knowledge Objects.
- Ontology.
- Graph.
- Pipeline.
- Review.
- PKA Builder.
- AI Workbench.
- Settings.

---

# 3. Dashboard

The dashboard shall summarize the current project:

- Number of sources.
- Number of Knowledge Objects.
- Draft objects.
- Objects under review.
- Approved objects.
- Missing source references.
- Relationship coverage.
- PKA readiness.
- Recent activity.

The dashboard is not a marketing screen. It is an operational control panel.

---

# 4. Sources Experience

The Sources area shall allow users to:

- Upload professional documents.
- Add manual source notes.
- Organize sources by domain and type.
- View processing status.
- Inspect extracted text.
- Link sources to Knowledge Objects.
- Mark source reliability.

Users should always know which source supports which item of knowledge.

---

# 5. Knowledge Object Repository Experience

The Knowledge Object Repository shall support:

- List view.
- Filter by type.
- Filter by status.
- Filter by domain.
- Search.
- Object detail panel.
- Relationship panel.
- Source evidence panel.
- Governance history.

Each object page should show:

- Object identity.
- Human-readable explanation.
- Evidence.
- Related objects.
- AI-generated suggestions.
- Review status.
- Version history.

---

# 6. Ontology Experience

The Ontology area shall help users define the shape of the domain.

It should support:

- Domain categories.
- Object types.
- Relationship types.
- Required fields.
- Controlled vocabulary.
- Synonyms.
- Hierarchy.

The ontology is the blueprint for how professional knowledge is structured.

---

# 7. Graph Experience

The graph view shall help users inspect relationships between objects.

The MVP graph should support:

- Node search.
- Relationship filtering.
- Object type filtering.
- Source-backed relationship indicators.
- Isolated object detection.
- Missing relationship warnings.

The graph is for professional understanding and quality control, not decoration.

---

# 8. Pipeline Experience

The Pipeline area shall show each stage of knowledge manufacturing:

1. Ingestion.
2. Extraction.
3. Classification.
4. Relationship mapping.
5. AI enrichment.
6. Human review.
7. Approval.
8. Packaging.

Users should be able to see what stage each source or object is currently in.

---

# 9. Review Experience

The Review area shall support expert validation.

Reviewers need to:

- Compare extracted knowledge against source evidence.
- Accept or reject AI suggestions.
- Edit object descriptions.
- Add reviewer notes.
- Approve objects.
- Request changes.
- Deprecate outdated objects.

Professional accountability must remain visible.

---

# 10. PKA Builder Experience

The PKA Builder shall guide users through release preparation:

- Select approved Knowledge Objects.
- Include ontology.
- Include relationship graph.
- Include prompts and rules.
- Include runtime configuration.
- Validate manifest.
- Run readiness checks.
- Export package.

The builder should prevent release when governance requirements are incomplete.

---

# 11. AI Workbench Experience

The AI Workbench shall let users test the knowledge asset:

- Ask questions.
- Inspect retrieved evidence.
- Compare answers against source material.
- Test different prompts.
- Test local Ollama models.
- Flag weak or unsupported answers.

The workbench should show why an answer was produced, not only the answer itself.

---

# 12. UX Principle

Knowledge Factory Studio should make the knowledge manufacturing process observable.

Users should never feel that knowledge disappears into an AI black box.

---

**End of Volume C**

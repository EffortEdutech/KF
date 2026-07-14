# Knowledge Factory

## Volume H - Local Development Architecture

**Version:** 1.0 (Architecture Baseline)

---

# 1. Purpose

Knowledge Factory Version 1 should be developed locally first.

The platform does not require large infrastructure during early development because it orchestrates knowledge, workflows, data, and AI rather than training large language models.

---

# 2. Recommended Local Stack

The local development stack may include:

```text
Laptop
  VS Code / Codex / Claude Code
  Knowledge Factory web app
  PostgreSQL + pgvector
  Neo4j or graph exploration layer
  Redis
  MinIO
  Ollama
  Qwen / Gemma / Llama models
  Docker Desktop
  Git
```

---

# 3. Application Architecture

The first implementation can be a web application.

Recommended structure:

- Frontend web app.
- Backend API.
- Worker process.
- Database.
- Object storage.
- Vector search.
- Local AI provider.
- Queue.

---

# 4. Storage Components

## PostgreSQL

Stores:

- Users.
- Projects.
- Sources.
- Knowledge Objects.
- Reviews.
- PKA records.
- Audit logs.

## pgvector

Stores embeddings for:

- Source chunks.
- Knowledge Objects.
- PKA search.

## Neo4j or Graph Layer

Supports:

- Relationship exploration.
- Graph visualization.
- Graph queries.
- Domain mapping.

Neo4j is optional for the earliest MVP if relationships are stored relationally first.

## MinIO

Stores:

- Uploaded source files.
- Extracted text artifacts.
- PKA export packages.
- Generated reports.

## Redis

Supports:

- Job queue state.
- Temporary pipeline state.
- Caching.

---

# 5. AI Components

Ollama should be supported for local model execution.

Initial local models may include:

- Qwen.
- Gemma.
- Llama.

The model provider layer should hide provider-specific details from application services.

---

# 6. Development Phases

## Phase 1 - Local Foundation

- Set up web app.
- Set up database.
- Set up object storage.
- Set up local AI provider.
- Create project and source management.

## Phase 2 - Knowledge Objects

- Create Knowledge Object schema.
- Build object repository.
- Add manual object editing.
- Add source linking.

## Phase 3 - Pipeline

- Add ingestion.
- Add extraction.
- Add AI suggestions.
- Add review workflow.

## Phase 4 - PKA Packaging

- Build manifest.
- Export package.
- Validate package.
- Create local test harness.

## Phase 5 - Runtime Integration

- Load PKA into LADOS-compatible runtime.
- Test assistant behavior.
- Test workflow behavior.
- Verify evidence retrieval.

---

# 7. Local-First Principle

Developing locally first keeps the product understandable.

Once the architecture is proven, each component can later move to dedicated servers or managed cloud services without changing the core product model.

---

**End of Volume H**

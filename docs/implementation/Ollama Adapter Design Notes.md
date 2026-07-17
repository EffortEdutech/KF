# Ollama Adapter Design Notes

**Status:** Deferred design note  
**Date:** 2026-07-17  
**Implementation status:** Not implemented

---

## 1. Purpose

This note captures the intended local Ollama adapter direction after the deterministic Knowledge Factory path is stable.

The adapter must not replace the deterministic ingestion, review, package release, or runtime import checks. It should only sit behind the existing provider/model router boundary and assist drafting after source extraction, package governance, and runtime import contracts remain reliable.

---

## 2. Non-Negotiable Boundaries

- AI output remains draft until human governance approves it.
- The deterministic fake provider remains the default test provider.
- Ollama must be optional and disabled unless explicitly configured.
- KF must not send sensitive organizational knowledge to any external model provider by default.
- The package installer and runtime import harness must not depend on Ollama.
- Ollama failures must not block manual source, KO, governance, or package workflows.

---

## 3. Proposed Adapter Shape

The first adapter should live behind `packages/ai` provider contracts.

Initial capability targets:

- `extraction`
- `summarization`
- `classification`
- `relationship_suggestion`
- `drafting`

Configuration should be explicit:

```text
KF_AI_PROVIDER=ollama
KF_OLLAMA_BASE_URL=http://localhost:11434
KF_OLLAMA_MODEL=<local-model-name>
```

No secret is required for a local Ollama endpoint. If a future remote Ollama-compatible endpoint needs credentials, those values must stay in local environment configuration and never be committed.

---

## 4. First Implementation Slice

When approved, implement only:

1. A small `OllamaModelProvider` behind the existing provider interface.
2. Health/status detection for configured local endpoint.
3. Timeout and error handling that falls back to visible pipeline failure state.
4. Tests using mocked HTTP responses, not a required live model.
5. Documentation for local setup and explicit opt-in.

Do not implement model selection UI, streaming chat, embeddings, vector search, or autonomous agents in the first slice.

---

## 5. Readiness Gate Before Coding

Do not start the Ollama adapter until these remain green:

- deterministic source ingestion,
- KO and relationship suggestion governance,
- package release approval/publish workflow,
- package archive/ZIP readback,
- `/runtime-import` package installer contract,
- runtime import decision audit trail.

---

**End of Ollama Adapter Design Notes**

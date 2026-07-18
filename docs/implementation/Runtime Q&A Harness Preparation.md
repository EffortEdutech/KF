# Runtime Q&A Harness Preparation

**Status:** Prepared contract surface  
**Date:** 2026-07-17  
**Implementation status:** Deterministic readiness harness only

---

## 1. Purpose

The Runtime Q&A harness prepares the boundary for future grounded answers against published PKA content.

It does not call an AI provider, does not implement Ollama, and does not answer user questions yet. Its purpose is to show what context a runtime app may use when a future Q&A engine is added.

---

## 2. Allowed Context

Future grounded Q&A may use:

- published PKA package metadata,
- approved, expert-validated, or published Knowledge Objects,
- approved graph relationships,
- source citation and evidence metadata,
- runtime capability declarations from the PKA manifest.

---

## 3. Blocked Context

Future grounded Q&A must not use:

- draft Knowledge Objects,
- unapproved AI suggestions,
- failed or unreviewed pipeline output,
- client vault state,
- runtime user records,
- private application data outside the selected package/context boundary.

---

## 4. Current Harness Behavior

`/runtime-qa` currently shows:

- selected project,
- published package count,
- approved Knowledge Object count,
- graph edge count,
- zero model calls,
- context readiness checks,
- deterministic answer readiness report,
- context bundle preview,
- runtime context instructions,
- approved context preview,
- deterministic fixture questions with expected citation requirements.
- fixture-by-fixture deterministic evaluation with canned demo answers.

This keeps the future Q&A surface aligned with the PKA package and runtime import contract before any model integration exists.

---

## 5. Deterministic Fixture Questions

The first fixture questions are not answered by AI. They define what a future answer must prove:

- it must cite approved Knowledge Objects,
- it must cite source evidence when source evidence exists,
- it must cite governed relationships when the question asks about support/dependency,
- it must refuse draft pipeline suggestions as runtime answer context.

---

## 6. Answer Readiness Report

The answer readiness report is deterministic. It blocks future answer generation when any of these are missing:

- published package,
- approved Knowledge Objects,
- source citation candidates,
- governed relationships when a fixture question requires relationship context.

This report is a preflight gate only. It does not retrieve with embeddings, rank context, call a model, or generate an answer.

---

## 7. Fixture Evaluation

The fixture evaluation report checks each demo question against the current context bundle.

It reports:

- whether required context is present,
- which context types are missing,
- which approved KOs and source evidence would be cited,
- how many governed relationships are available,
- a deterministic canned answer for local proof-of-concept review.

These answers are not AI-generated. They are a contract harness for future AIFA/LADOS runtime developers.

---

## 8. Ollama Boundary

Ollama remains deferred. A future local model adapter may be used only after deterministic ingestion, suggestion governance, package release, runtime import, and Q&A context boundaries remain stable.

---

**End of Runtime Q&A Harness Preparation**

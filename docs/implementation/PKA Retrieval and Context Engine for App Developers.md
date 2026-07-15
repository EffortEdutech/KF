# PKA Retrieval and Context Engine for App Developers

**Date:** 2026-07-15  
**Status:** Developer-facing architecture note  
**Audience:** AIFA, LADOS, and future app developers building on KF IP and PKAs  
**Related KF docs:** `PKA Anatomy and Runtime Boundary.md`, `Volume F - Intelligence Engine and Knowledge Manufacturing Pipeline.md`, `Volume G - LADOS Runtime Integration.md`

---

## 1. Purpose

This document explains how applications should use Professional Knowledge Assets without sending entire PKA packages, knowledge graphs, source libraries, or client vaults to a cloud AI model.

It is written for app developers who will build products on top of KF-manufactured PKAs.

The core principle:

```text
Apps do not give the LLM the whole PKA.
Apps retrieve the smallest useful governed context from the PKA,
then send only that context to the model.
```

This is the same pattern used by local Graphify-assisted development: the graph stays local, retrieval happens locally, and only the selected context is sent to the cloud model.

---

## 2. Alignment With Knowledge Factory

This architecture is aligned with Knowledge Factory.

Knowledge Factory manufactures PKAs as structured, governed professional intelligence packages. A runtime product such as AIFA or LADOS loads a PKA and exposes it through its own runtime services.

The PKA is valuable because it is not merely a document archive. It contains:

- Knowledge Objects,
- ontology,
- graph relationships,
- rules,
- workflows,
- templates,
- formulas or models,
- prompts and instructions,
- source references,
- governance metadata.

That structure makes precise retrieval possible.

Without retrieval, an app would have to send too much context to an AI model. With retrieval, the app sends only the relevant, permissioned, approved knowledge needed for the current task.

---

## 3. Reference Pattern: Local Graphify With Cloud AI

Graphify shows the same architectural pattern at development time.

```text
Developer Computer
  Source code
      |
      v
  Graphify
      |
      v
  graph.json / graph.db
      |
      v
  Local CLI or MCP server
      |
      v
  Codex or Claude Code desktop client
      |
      v
  Selected context only
      |
      v
  Cloud AI model
```

The cloud model does not need the full graph. The local tool performs retrieval and returns a focused result.

For example:

```text
User asks:
  Where is the invoice approval workflow?

Local retrieval finds:
  ApprovalWorkflow
  Invoice
  PaymentService
  relevant edges and file references

Cloud model receives:
  the focused retrieved result,
  not the whole repository graph.
```

The same pattern applies to PKAs in runtime products.

---

## 4. Runtime Pattern for PKA-Based Apps

A PKA-based app should use a retrieval and context engine between the PKA and the AI model.

```text
Installed PKA
    |
    v
Knowledge Graph + Object Index + Rule Index
    |
    v
Knowledge Retrieval and Context Engine
    |
    v
Runtime Tool / MCP Tool / Internal API
    |
    v
Selected governed context
    |
    v
AI model
    |
    v
Application response or action
```

The app asks the retrieval engine for relevant context. The retrieval engine enforces governance, permissions, ranking, and context limits before the model sees anything.

---

## 5. Knowledge Retrieval and Context Engine

For app developers, the runtime retrieval component may be called:

- Knowledge Retrieval Engine,
- Knowledge Context Engine,
- PKA Retrieval Engine,
- Runtime Knowledge Service,
- KRE.

The exact product name may differ by app. The responsibility should remain the same.

The engine must:

- query installed PKA content,
- traverse graph relationships,
- retrieve relevant Knowledge Objects,
- retrieve relevant rules and workflows,
- retrieve source references and governance metadata,
- rank and trim context,
- enforce permission and approval boundaries,
- return uncertainty when evidence is insufficient,
- produce model-ready context bundles.

---

## 6. What Gets Sent to the AI Model

The model should receive a small context bundle, not the entire PKA.

A typical context bundle may contain:

- 5 to 30 relevant Knowledge Objects,
- selected graph relationships,
- applicable rules,
- required workflow steps,
- source evidence excerpts,
- governance status,
- confidence/readiness notes,
- runtime instructions.

For example, a construction claims app might send:

```text
Question:
  How do I assess this variation claim?

Retrieved context:
  18 Knowledge Objects
  4 workflow nodes
  7 rules
  3 source references
  1 escalation instruction
```

The model then reasons over the selected governed context.

---

## 7. What Must Not Be Sent by Default

Apps must not send the following to a cloud model by default:

- entire PKA packages,
- entire knowledge graphs,
- complete source document libraries,
- full client vaults,
- unrelated business records,
- secrets or credentials,
- private tokens,
- unapproved draft knowledge,
- client-specific adaptations unless authorized and relevant.

Sensitive organizational knowledge should remain local/private unless the app is explicitly configured to send it.

---

## 8. Governance Rules for Retrieval

The retrieval engine must preserve KF governance.

Minimum rules:

- Published or approved knowledge can be used for production answers.
- Draft or AI-generated knowledge must not be presented as approved.
- Source evidence must remain traceable.
- If retrieved evidence is weak or missing, the model should say so.
- Runtime products must respect role, workspace, organization, and client boundaries.
- Client-adapted PKA instance data must not silently alter the Base PKA.

This preserves the KF principle:

```text
AI assists.
Humans govern.
PKAs carry approved professional intelligence.
```

---

## 9. AIFA Developer Guidance

AIFA is a PKA-powered mobile financial assistant.

AIFA should not send the full Finance PKA to a cloud model. Instead:

```text
AIFA Mobile
  captures user intent

AIFA PKA Runtime Engine
  asks the local Finance PKA retrieval engine for context

Finance PKA Retrieval Engine
  retrieves rules, workflows, templates, and relevant Knowledge Objects

AI model
  receives selected context and generates explanation/recommendation

AIFA
  presents result and records user confirmation where needed
```

Example:

```text
User asks:
  Should I delay this supplier payment?

AIFA retrieves:
  cash flow rules,
  payment priority framework,
  current payable context,
  risk thresholds,
  relevant workflow steps.

AI model receives only that bundle.
```

Business financial records remain part of AIFA's runtime/client vault. They are not automatically promoted into the Base Finance PKA.

---

## 10. LADOS Developer Guidance

LADOS is a runtime and orchestration platform.

LADOS should expose installed PKAs through runtime tools or MCP-compatible interfaces.

```text
LADOS Runtime
  PKA Loader
  Knowledge Runtime
  Graph Engine
  Workflow Engine
  Tool Integration Layer
      |
      v
  PKA Retrieval Tool
      |
      v
  Selected context for AI agents and workflows
```

For example:

```text
User asks:
  How do I perform a CIDB claim?

LADOS retrieves:
  relevant claim Knowledge Objects,
  workflow nodes,
  rules,
  source references,
  required templates.

The AI receives:
  a focused context bundle,
  not the whole Civil Engineering PKA.
```

This keeps runtime responses faster, cheaper, more accurate, and more governable.

---

## 11. Suggested Context Bundle Shape

Apps may use their own API format, but the bundle should carry these concepts:

```json
{
  "query": "How do I assess this variation claim?",
  "pka": {
    "packageId": "pka-qs-rfq",
    "version": "0.1.0",
    "domain": "Quantity Surveying"
  },
  "retrievedAt": "2026-07-15T00:00:00.000Z",
  "governanceMode": "approved_only",
  "knowledgeObjects": [],
  "relationships": [],
  "rules": [],
  "workflows": [],
  "templates": [],
  "sourceEvidence": [],
  "runtimeInstructions": [],
  "limitations": []
}
```

The important design is not the exact JSON. The important design is that the context bundle is:

- bounded,
- traceable,
- permissioned,
- ranked,
- model-ready,
- governed.

---

## 12. Retrieval Pipeline

A minimal retrieval pipeline:

```text
User intent
    |
    v
Normalize query
    |
    v
Check runtime permissions
    |
    v
Find candidate Knowledge Objects
    |
    v
Traverse graph relationships
    |
    v
Retrieve rules, workflows, templates, and evidence
    |
    v
Filter by governance status
    |
    v
Rank by relevance, confidence, freshness, and domain fit
    |
    v
Build context bundle
    |
    v
Send selected context to model
```

Later versions may add vector retrieval, hybrid graph/vector ranking, reranking, caching, user feedback, and MCP tool discovery.

---

## 13. MCP Integration

For cloud AI or external agents, apps may expose PKA retrieval through MCP tools.

Example tools:

- `search_pka_knowledge`
- `get_knowledge_object`
- `find_workflow`
- `get_applicable_rules`
- `get_source_evidence`
- `build_context_bundle`

The MCP server should run in the app or local runtime environment, not in the cloud model. The model requests a tool call; the local/runtime tool performs retrieval; the model receives only the returned result.

This is the same design pattern as local Graphify use in Codex or Claude Code.

---

## 14. Developer Do and Do Not

Do:

- keep PKA retrieval local or runtime-controlled where possible,
- send only selected context to AI models,
- include governance and source references,
- separate Base PKA from client-adapted PKA instance data,
- log retrieval decisions for audit,
- support model-provider independence.

Do not:

- upload entire PKAs to an LLM,
- bypass governance status,
- mix runtime business records into the Base PKA,
- treat AI output as approved knowledge,
- depend on one AI provider,
- hide uncertainty when evidence is insufficient.

---

## 15. Impact on KF Roadmap

This architecture should be reflected in future KF work.

Recommended additions:

- define a formal PKA context bundle contract,
- define retrieval APIs for exported PKAs,
- add retrieval capability requirements to PKA manifests,
- include graph traversal and ranking in the runtime harness,
- add MCP-style tool examples for LADOS and AIFA,
- add tests that ensure unapproved knowledge is excluded from production context.

This belongs primarily in future runtime integration and AI Workbench work, but the vocabulary should be introduced early so app developers build against the right mental model.

---

## 16. Decision

Accepted for app-developer alignment:

- KF manufactures governed PKAs.
- Apps load or install PKAs.
- Apps retrieve focused context from PKAs.
- Cloud AI receives selected governed context, not whole PKAs.
- Retrieval must preserve governance, provenance, permissions, and source traceability.
- MCP can expose PKA retrieval as tools without uploading the full PKA or graph.

**End of Developer Note**

# Knowledge Factory (KF)

## KF 5_3 - LADOS Server and Local AI Deployment Architecture

**Version:** 1.0 (Strategic Extension)

---

# Chapter 1 - Purpose

This document defines the deployment concept for running LADOS with installed Professional Knowledge Assets and local AI models such as Ollama.

The key conclusion is that LADOS should be viewed as a Professional Knowledge Server.

---

# Chapter 2 - Professional Knowledge Server Model

In this model, users access LADOS through web, mobile, or desktop clients.

LADOS hosts the runtime engines, installed PKAs, data stores, and AI integration layer.

```text
Users
  Web / Mobile / Desktop
        |
        v
LADOS
  Workflow Engine
  Mission Engine
  Knowledge Runtime
  Graph Engine
  API Gateway
        |
        +-- PostgreSQL + pgvector
        +-- Object Storage
        +-- Redis Cache
        |
        v
Installed PKAs
  Civil / Electrical / Robotics / Healthcare / Legal
        |
        v
Ollama Server
  Qwen / Llama / DeepSeek / Gemma
```

---

# Chapter 3 - Request Flow

Example user request:

> Prepare a concrete pouring inspection checklist.

The flow should be:

1. User sends the request to LADOS.
2. LADOS identifies the relevant Civil Engineering PKA.
3. The Knowledge Runtime loads the civil ontology, QA/QC workflows, inspection templates, and relevant reasoning rules.
4. The retrieval layer fetches relevant knowledge.
5. Ollama performs reasoning using the retrieved context.
6. LADOS formats the output and may launch an inspection workflow.

In this model, AI is guided by the PKA rather than relying only on general model training.

---

# Chapter 4 - Recommended Server Architecture

For an SME or engineering firm:

| Component | Recommendation |
| --- | --- |
| Application | LADOS |
| Database | PostgreSQL + pgvector |
| Cache | Redis |
| File Storage | MinIO or local storage |
| Graph Database | Optional, or PostgreSQL if sufficient |
| Local AI | Ollama |
| Reverse Proxy | Nginx or Caddy |
| Containers | Docker Compose initially, Kubernetes later |

This architecture can start simple and grow over time.

---

# Chapter 5 - AI Model Roles

LADOS should not depend on one model for every task.

Recommended model roles:

- Qwen: general reasoning and document drafting.
- DeepSeek: programming and workflow generation.
- Llama: broad conversational tasks.
- Gemma: lightweight deployments.

LADOS should choose the most suitable model based on the mission, workflow, deployment policy, and available infrastructure.

---

# Chapter 6 - Hardware Guidance

## Small Office

Suitable for 5-20 users:

- 12-16 CPU cores.
- 64 GB RAM.
- 2 TB NVMe SSD.
- NVIDIA GPU with 16-24 GB VRAM, optional but highly beneficial.

This supports a few PKAs and a single local model.

## Medium Organization

Suitable for 20-100 users:

- 24-32 CPU cores.
- 128 GB RAM.
- 4-8 TB NVMe SSD.
- NVIDIA GPU with 48 GB+ VRAM or multiple GPUs.

This supports several professional PKAs, larger models, and more concurrent users.

## Enterprise

Enterprise deployment may require:

- Multiple application servers.
- Dedicated AI servers.
- Separate database server.
- Load balancer.
- Shared object storage.
- High availability.
- Backup infrastructure.

---

# Chapter 7 - Model Router

LADOS should include a Model Router instead of talking directly to Ollama.

```text
LADOS
   |
   v
Model Router
   |
   +-- Ollama (local)
   +-- OpenAI
   +-- Anthropic
   +-- Google
   +-- Azure OpenAI
   +-- Future providers
```

The Knowledge Runtime should request capabilities such as:

- Reasoning.
- Code generation.
- Summarization.
- Drafting.
- Extraction.

The Model Router selects a provider according to policy, availability, cost, privacy, and local-only requirements.

---

# Chapter 8 - Strategic Value

The combination of LADOS, PKAs, and local AI is especially valuable where cloud AI is unsuitable due to:

- Privacy requirements.
- Regulation.
- Confidential documents.
- Unreliable connectivity.
- Cost control.
- Internal governance.

In this setup:

- Knowledge Factory produces the PKAs.
- LADOS installs and executes the PKAs.
- Ollama or another local inference server supplies model capability.
- PostgreSQL and pgvector store structured knowledge and embeddings.
- The organization owns its knowledge, workflows, and AI runtime.

---

**End of KF 5_3**

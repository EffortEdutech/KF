# AI Workspace Context

This file is a project-local bridge to the Effort Studio central Obsidian vault.

It exists because some Codex or Claude sessions mount only the project folder. In those sessions, the central vault may be outside the sandbox even though it exists on the machine.

## Central Vault

~~~text
C:\Users\user\Documents\00 AI agent\AI-Knowledge
~~~

## How To Use This File

- Read this file only for architecture rationale, ADR, roadmap, cross-project context, and workspace operating rules.
- Do not use this file as a replacement for project docs or source files.
- If the central vault is accessible, prefer the live vault note listed below.
- If the central vault is not accessible, use this local bridge as the fallback context and mention that the live vault was outside the current sandbox.

## Live Vault Note

~~~text
C:\Users\user\Documents\00 AI agent\AI-Knowledge\Projects\KF\Overview.md
~~~

## Synced Project Overview

# KF Overview

## Purpose

KF is the Knowledge Factory architecture and future implementation workspace. Knowledge Factory is a professional knowledge manufacturing platform that transforms trusted source material into governed, versioned, reusable Professional Knowledge Assets.

## Repository

~~~text
C:\Users\user\Documents\00 KF
~~~

## Project Docs

Start with:

~~~text
docs\v1\00 - Knowledge Factory Documentation Series - Version 1.0 Frozen.md
docs\v1\01 - Documentation Architecture - Version 1.0 Frozen.md
docs\v1\KF 1_0 - Vision, Philosophy & Product Strategy.md
docs\v1\TRY 1\00 - Documentation Map.md
docs\v1\TRY 1\Volume I - Engineering Constitution.md
docs\v1\TRY 1\Volume J - Development Roadmap.md
~~~

## Architecture Baseline

- Product: Knowledge Factory.
- Category: professional knowledge manufacturing platform.
- Core unit: Knowledge Object.
- Core output: governed Professional Knowledge Assets.
- Core process: Knowledge Manufacturing Pipeline with human governance and AI assistance.
- Runtime boundary: Knowledge Factory manufactures PKAs; LADOS executes or hosts PKAs as a runtime target.
- AI posture: provider-independent, with support for local/private deployment and Ollama-oriented development.
- Current folder state: documentation-first project; source code folders are not created yet.

## AI Setup

Project-local assistant files:

~~~text
C:\Users\user\Documents\00 KF\AGENTS.md
C:\Users\user\Documents\00 KF\CLAUDE.md
~~~

Project-local Graphify wrappers:

~~~text
C:\Users\user\Documents\00 KF\scripts\graphify.ps1
C:\Users\user\Documents\00 KF\scripts\graphify.sh
~~~

## Current Graphify Scope

Initial documentation graph scope:

- `docs\v1`

Future code graph folders:

- `apps`
- `services`
- `packages`
- `database`
- `infrastructure`
- `tests`
- `tools`

Markdown semantic graph extraction requires an LLM API key for the current docs-only state. Once implementation folders exist, code-only extraction can run without semantic document extraction.

## Related Notes

- [[Architecture/AI Development Workspace]]
- [[Architecture/Graphify + Obsidian Workflow]]
- [[Architecture/Codex + Claude Code Workflow]]
- [[Projects/LADOS/Overview]]


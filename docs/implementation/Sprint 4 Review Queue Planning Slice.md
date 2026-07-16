# Sprint 4 Review Queue Planning Slice

Date: 2026-07-16

Status: implementation started

## 1. Purpose

Sprint 4 will turn Knowledge Object governance from simple lifecycle transitions into an explicit review workflow. This planning slice defines the minimum review queue boundary early so Sprint 2 repository work does not paint the project into a corner.

## 2. Sprint 4 Outcome

Reviewers should be able to:

- see Knowledge Objects ready for professional review,
- compare each Knowledge Object against source evidence and relationship context,
- approve, reject, or request changes,
- record reviewer accountability,
- preserve version/audit history,
- expose readiness gaps before PKA package release.

## 3. Queue Entry Rule

The first review queue should include Knowledge Objects where:

- `status = under_review`,
- project matches the active project or selected workspace scope,
- object has at least one evidence link or a documented manual/expert-input reason,
- relationship readiness hints are visible, even when incomplete.

Draft Knowledge Objects remain editable repository work. Approved, published, rejected, archived, and deprecated objects should not appear in the default active review queue.

## 4. Minimum Review Record

The existing Prisma `Review` model is sufficient for the first Sprint 4 slice:

- `id`
- `knowledgeObjectId`
- `reviewerId`
- `decision`
- `notes`
- `createdAt`

Do not add a larger workflow engine until the basic queue and reviewer decision path are proven.

Implementation decision:

- `/review` is the dedicated Sprint 4 route.
- Default queue membership is `status = under_review`.
- Reviewer decisions support `approved`, `changes_requested`, and `rejected`.
- Reviewer decisions create `Review` records, lifecycle updates, audit events, and Mission traces.
- Dashboard and Review expose governance metrics and PKA release-blocking checks.
- Review history can be filtered by decision and reviewer.
- Review queue can be filtered by lifecycle queue status.
- Release-blocking readiness checks can be filtered by blocker type.
- Dashboard metrics drill into filtered Review and PKA Builder views.
- Dashboard and PKA Builder release blockers link back to KO-specific Review views where possible.
- The PKA Builder starts as a release-readiness gate before full Sprint 6 package assembly.
- Review exposes first KO-specific remediation actions: lifecycle blockers can send a KO back to review, and evidence, metadata, and relationship blockers deep-link to the KO workspace.

## 5. Version Boundary

Sprint 2 created audit-backed version snapshot placeholders before editable KO changes. Sprint 4 promotes this into a dedicated `KnowledgeObjectVersion` table.

Promotion is justified when reviewers need to:

- compare before/after content,
- restore a previous version,
- approve a specific immutable version,
- include exact KO versions in PKA package manifests.

Audit events remain the governance timeline, but immutable KO content snapshots belong in `KnowledgeObjectVersion`.

## 6. Readiness Signals

The review queue should surface these signals before a reviewer decides:

- source evidence count,
- missing source evidence warning,
- relationship count,
- draft relationship warning,
- weak relationship confidence warning,
- missing relationship provenance warning,
- current lifecycle status,
- current version,
- latest governance events.

Implementation status:

- Missing source evidence is a warning.
- Unapproved/non-release-grade KO status is a warning.
- Missing owner, author, tags, or confidence are warnings.
- Isolated, weak-confidence, or missing-provenance relationships are warnings.
- PKA release readiness aggregates KO-level blockers at project level.
- The first blocker filters are missing evidence, approval status, ownership metadata, tags, confidence, isolated KO, weak relationship, relationship provenance, and no package KOs.

## 7. Runtime Test Gate

Playwright is approved as the KF browser/runtime test runner direction and `@playwright/test` is installed.

The first runtime smoke script is:

```powershell
corepack pnpm test:runtime
```

The full local check including runtime smoke is:

```powershell
corepack pnpm check:runtime
```

Before wiring Playwright into `pnpm check`, decide:

- runner package and package manager command,
- whether tests run against the Next dev server or production build,
- local database reset strategy,
- which browser flows are mandatory for `pnpm check`.

Runtime orchestration:

- `playwright.config.ts` starts the Studio dev server on the configured `KF_STUDIO_URL`, defaulting to `http://localhost:4700`.
- Runtime tests reset and reseed the workspace through `/api/test/reset` before each test.
- The reset route is intended only for local/dev/runtime-test use and is closed in production unless explicitly enabled through `KF_ENABLE_TEST_RESET=1`.

Decision:

- Keep `test:runtime` separate from default `pnpm check` until deterministic server orchestration and database reset/seed behavior are implemented.
- Continue Sprint 4 hardening before Sprint 5: Review remediation and browser coverage should be stable before the ontology/graph quality surface expands.

Recommended first browser/runtime flows:

- create KO from `/knowledge-objects`,
- transition KO to `under_review`,
- record reviewer request-changes decision,
- verify Review decision history filters,
- verify PKA Builder filtered blocker drilldowns back into Review,
- later add edit/version snapshot and relationship creation flows.

## 8. Current Sprint 4 Implementation

The `/knowledge-objects` page includes a review queue preview for under-review Knowledge Objects. The `/review` route is now the active Sprint 4 governance queue and supports queue-status, reviewer, decision, and blocker-type filtering. The `/pka-builder` route is the first release-readiness gate and links blockers back to Review where a Knowledge Object can be identified.

**End of Sprint 4 Review Queue Planning Slice**

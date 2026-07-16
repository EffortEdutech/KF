# Knowledge Factory Local Development Setup

**Status:** Sprint 4 governance implementation
**Host strategy:** standalone-first with LADOS-compatible boundaries

---

## 1. Prerequisites

- Node.js 20.9 or newer.
- Corepack.
- Docker Desktop.
- Git.

Do not reuse databases, Docker volumes, or containers from other projects.

---

## 2. Install Dependencies

```powershell
corepack enable
corepack pnpm install
```

---

## 3. Configure Environment

Copy `.env.example` to `.env`, then adjust local values if needed.

The default PostgreSQL port is `55432` so KF does not collide with the existing RAFIQ Supabase/Postgres container on `55422`.

---

## 4. Start Local Infrastructure

```powershell
corepack pnpm infra:up
```

This starts a dedicated `kf-postgres` container with its own `kf_postgres_data` volume.

Current verification note, 2026-07-15:

- `corepack pnpm db:generate` succeeds.
- `corepack pnpm infra:up` succeeds through `scripts/docker-compose.ps1`, which
  resolves Docker from PATH or Docker Desktop's default Windows install path.
- `kf-postgres` is healthy on port `55432`.
- Initial Prisma migration `20260715094912_init` has been applied.
- Knowledge Object version migration `20260716090000_add_knowledge_object_versions` has been applied.

---

## 5. Database Commands

```powershell
corepack pnpm db:generate
corepack pnpm db:migrate
```

The Prisma schema lives at:

```text
packages/db/prisma/schema.prisma
```

---

## 6. Run the Studio

```powershell
corepack pnpm dev
```

The Studio app lives at:

```text
apps/studio
```

The default KF Studio URL is:

```text
http://localhost:4700
```

Sprint 1 project creation, source registration, and Mission Centre controls use
Prisma/PostgreSQL when `DATABASE_URL` is configured. The Studio service layer
keeps an in-memory fallback for environments where the database is not
configured, but the KF local development path is now PostgreSQL-backed.

---

## 7. Quality Checks

```powershell
corepack pnpm check
```

or:

```powershell
.\scripts\check.ps1
```

Runtime/browser smoke test:

```powershell
corepack pnpm test:runtime
```

Full local check including runtime smoke test:

```powershell
corepack pnpm check:runtime
```

The runtime smoke test uses Playwright. `corepack pnpm test:runtime` runs `scripts/run-runtime-tests.mjs`, which starts the Studio dev server through `scripts/runtime-studio-server.mjs`, runs Playwright with the built-in webServer disabled, and then stops the Studio process tree. The default URL is:

```text
http://localhost:4700
```

Set `KF_STUDIO_URL` to point the test at another local Studio URL.

Runtime tests reset and reseed the local workspace through `/api/test/reset` before each test. The route requires a local request plus the `x-kf-test-reset-token` header. Playwright sets this from `KF_TEST_RESET_TOKEN`, defaulting to `kf-local-runtime-reset`.

Database-backed runtime resets are allowed only for local database URLs unless `KF_ALLOW_DATABASE_TEST_RESET=1` is explicitly set by the test runner.

`test:runtime` remains separate from default `check` until KF has stronger safeguards for database-backed resets in non-local environments.

---

## 8. Local Package Exports

Draft PKA assembly persists inspectable JSON package files under:

```text
storage/exports/<packageId>
```

The folder includes `manifest.json`, ontology, Knowledge Object, graph, source, governance, placeholder component index files, `package-archive.json`, and `package.zip`. The `storage/exports` contents are local development artifacts and are ignored by git.

See `docs/implementation/PKA Export Strategy.md` for the package update strategy and Base PKA/runtime-vault boundary.

---

## 9. Graphify Refresh

After meaningful structure changes:

```powershell
.\scripts\graphify.ps1 update .
```

---

## 10. Current Architecture Boundaries

- `apps/studio` - Next.js App Router Studio shell.
- `packages/core` - shared lifecycle, mission, role, and relationship contracts.
- `packages/db` - Prisma schema and database access boundary.
- `packages/ai` - provider/model-router contracts with fake provider first.
- `packages/pka` - PKA manifest, retrieval context, and package structure contracts.
- `packages/ui` - shared UI contracts/components.
- `packages/config` - runtime configuration boundary.

---

**End of Setup**

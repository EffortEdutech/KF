# Knowledge Factory Local Development Setup

**Status:** Sprint 1 active  
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

Sprint 1 source registration currently uses local in-memory session storage behind
the Studio service layer. The Prisma schema remains the persistence contract, but
PostgreSQL-backed mutations are deferred until Docker/Postgres verification is
available.

---

## 7. Quality Checks

```powershell
corepack pnpm check
```

or:

```powershell
.\scripts\check.ps1
```

---

## 8. Graphify Refresh

After meaningful structure changes:

```powershell
.\scripts\graphify.ps1 update .
```

---

## 9. Current Architecture Boundaries

- `apps/studio` - Next.js App Router Studio shell.
- `packages/core` - shared lifecycle, mission, role, and relationship contracts.
- `packages/db` - Prisma schema and database access boundary.
- `packages/ai` - provider/model-router contracts with fake provider first.
- `packages/pka` - PKA manifest and package structure contracts.
- `packages/ui` - shared UI contracts/components.
- `packages/config` - runtime configuration boundary.

---

**End of Setup**

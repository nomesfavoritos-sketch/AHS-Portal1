# AHS Portal — Allied Health Sciences Admissions Portal

## Overview

Full-stack admissions management system for Allied Health College, Nishtar Medical University (Pakistan). Manages the complete admissions lifecycle: programs, sessions, quota categories, applications, payment challans, document uploads, merit lists, verification desk, joined students, notices, and audit logs.

pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS 4 + shadcn/ui (artifact: `ahs-portal`)
- **API framework**: Express 5 (artifact: `api-server`)
- **Database**: PostgreSQL + Drizzle ORM (lib: `db`)
- **Auth**: Session-based (express-session + connect-pg-simple + bcryptjs). No JWT.
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle for API)
- **Routing (frontend)**: wouter
- **State/Data**: TanStack Query + generated hooks from `@workspace/api-client-react`

## User Roles

| Role | Credentials |
|------|-------------|
| super_admin | superadmin@ahscollege.edu.pk / Admin@1234 |
| admission_admin | admissions@ahscollege.edu.pk / Admin@1234 |
| verification_officer | verification@ahscollege.edu.pk / Admin@1234 |
| finance_verifier | finance@ahscollege.edu.pk / Admin@1234 |
| student | student@ahscollege.edu.pk / Student@1234 |

## Database Schema (13 tables)

`users`, `programs`, `sessions`, `quotas`, `studentProfiles`, `applications`, `documents`, `challans`, `meritLists`, `meritListEntries`, `verifications`, `notices`, `auditLogs`, `joinedStudents`

Session table: `session` (managed by connect-pg-simple, created manually).

## Frontend Routes

- `/` — Landing page with notices and CTA
- `/login`, `/register`, `/forgot-password`
- `/admin/*` — Admin layout: dashboard, programs, sessions, quotas, applications, challans, merit-lists, verification, students, notices, audit-logs, users, settings
- `/student/*` — Student layout: dashboard, profile, applications, challans, documents, merit, notices

## API Routes (prefix: `/api`)

- `GET /api/healthz`
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/register`, `POST /api/auth/forgot-password`
- `/api/users`, `/api/programs`, `/api/sessions`, `/api/quotas`
- `/api/applications`, `/api/challans`, `/api/documents`
- `/api/merit-lists`, `/api/verifications`, `/api/notices`
- `/api/audit-logs`, `/api/joined-students`
- `GET /api/dashboard/summary`

## Key Commands

- `pnpm --filter @workspace/scripts run seed` — seed demo data
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm run typecheck` — full typecheck across all packages

## Merit Score Formula

10% matric percentage + 40% inter percentage (additional fields TBD)

## Theme / Design

Deep navy institutional palette (primary: `222 47% 11%`), Plus Jakarta Sans font, clean and professional. Light mode only.

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

## Phase 2 Features (Object Storage + Full Student Workflow)

- **Object Storage**: Provisioned via Replit Object Storage bucket. API server has presigned URL endpoint at `POST /api/storage/uploads/request-url`. Files stored as private objects with ACL control.
- **Student Profile Wizard**: 4-step wizard (Personal Info → Classification & Quota → Academic Background → Review). Tracks 20 fields. `completionPercent` + `isComplete` computed from filled fields. ≥80% = complete, ≥50% required to submit application.
- **Application Workflow**: draft → challan_generated → slip_uploaded → submitted → under_review → verified/rejected/merit_listed/admitted. Challan auto-generated at PKR 500 on application creation.
- **Document Uploads**: Per-type upload cards using Uppy (`@workspace/object-storage-web`). 7 doc types: matricCertificate, intermediateCertificate, domicile, nidCopy, passportPhoto, medicalFitness, characterCertificate.
- **Paid Slip Upload**: Student uploads bank receipt via `POST /api/challans/:id/paid-slip`, advancing application to `slip_uploaded`.
- **Admin Reviews**: Status filter tabs on applications page, finance verification on challans, document verification officer flow, joined students management with `useMarkStudentJoined`.

## Object Storage Library

`@workspace/object-storage-web` provides:
- `ObjectUploader` component — Uppy v5 modal triggered by button, calls presigned URL endpoint
- `useUpload` hook — programmatic upload helper

## Programs (8 AHS Programs)

BSMLT, BSMIT (Radiology), BSRDT (Renal Dialysis), BSOOT (Optometry), BSANT (Anesthesia), BSEND (Endoscopy), BSDNT (Dental), BSOPT (Orthotics & Prosthetics)

## Merit Score Formula

10% matric percentage + 40% inter percentage (additional fields TBD)

## Theme / Design

Deep navy institutional palette (primary: `222 47% 11%`), Plus Jakarta Sans font, clean and professional. Light mode only.

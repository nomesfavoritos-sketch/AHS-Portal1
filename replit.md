# AHS Portal — Allied Health Sciences Admissions Portal

## Overview

Full-stack admissions management system for Allied Health College, Nishtar Medical University (Pakistan). Manages the complete admissions lifecycle: programs, sessions, quota categories, applications, payment challans, document uploads, merit lists, verification desk, joined students, notices, audit logs, reports analytics, and an institutional settings panel.

**Completed Phases:**
- Phase 1–5: Core infrastructure, auth, all admin CRUD (programs, sessions, quotas, applications, challans, merit lists, verification desk, joined students, notices, users)
- Phase 6: Student application pages with all 11 statuses; admin pipeline actions including "Route to Verification Desk"
- Phase 7: Landing page (home.tsx) with live programs/notices from API; Reports page with KPI cards, BarChart, PieChart, CSV export; Audit Logs with user names, date range, entityType, action filters, pagination; Settings page extended with Fee & Payment and Institution Branding sections; Reports API (`GET /api/reports/summary`) with aggregated stats by program/status/quota/session/joined

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

## Database Schema (17 tables)

`users`, `programs`, `sessions`, `quotas`, `studentProfiles`, `applications` (+ meritScore/Raw/Breakdown, joiningIntentAt), `documents`, `challans` (+ remarks), `meritLists`, `meritListEntries`, `verifications`, `notices`, `auditLogs`, `joinedStudents` (+ verifiedById, verifierName, removedAt, removedById, removalReason), `systemSettings`, `programSeatMatrix`, **`verificationChecklists`**, **`joiningDecisions`**

Session table: `session` (managed by connect-pg-simple, created manually).

## Frontend Routes

- `/` — Landing page with notices and CTA
- `/login`, `/register`, `/forgot-password`
- `/merit-search` — **Public** CNIC/application-number merit search (no login required)
- `/admin/*` — Admin layout: dashboard, programs (+ seat matrix section), sessions (+ milestone dates), quotas, applications, challans, merit-lists (full engine UI), verification, students, notices, audit-logs, users, settings (merit formula)
- `/student/*` — Student layout: dashboard, profile, applications, challans, documents, merit (detailed rank + breakdown), notices

## API Routes (prefix: `/api`)

- `GET /api/healthz`
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/register`, `POST /api/auth/forgot-password`
- `/api/users`, `/api/programs`, `/api/sessions`, `/api/quotas`
- `/api/applications`, `/api/challans`, `/api/documents`
- `/api/merit-lists` — CRUD, publish, freeze, recalculate
- `/api/merit-search` — Public CNIC/app-number merit search (no auth)
- `/api/settings` — GET/PATCH system settings (merit formula keys)
- `/api/seat-matrix` — CRUD seat allocation per program+session
- `/api/verifications`, `/api/notices`, `/api/audit-logs`, `/api/joined-students`
- `DELETE /api/joined-students/:id` — soft-remove joined student (requires reason ≥10 chars + "REMOVE" confirmation in UI)
- `POST /api/applications/:id/joining-intent` — student confirms joining intent (sets joiningIntentAt timestamp)
- `GET /api/verification-desk` — list applications eligible for joining verification (search by name/CNIC/app number)
- `GET /api/verification-desk/:id` — full candidate detail (profile, documents, challans, merit, checklist)
- `GET|PUT /api/verification-desk/:id/checklist` — get or save 8-item verification checklist per application
- `POST /api/verification-desk/:id/decision` — submit joining decision (accept_joining/reject_joining/send_back); auto-inserts joined_students on accept
- `GET /api/verification-desk/:id/decisions` — decision history with officer names
- `GET /api/dashboard/admin-summary` — 13 stats: totalApplications, pendingApplications, approvedApplications, rejectedApplications, totalStudents, totalPrograms, totalSessions, activeSession, pendingPayments, pendingVerifications, **joiningIntents**, **meritListedCount**, **totalJoined**
- `GET /api/dashboard/student-summary` — includes profileCompletion, meritRank, meritScore, joiningIntentConfirmed, joiningIntentAt, applicationStatuses

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

## Merit Score Formula (Phase 3 — Configurable)

`merit% = ((matric/matricTotal × matric_weight) + (fsc/fscTotal × fsc_weight)) / raw_total × 100`

Defaults: matric_weight=10, fsc_weight=70, tie_breaker=fsc_marks, raw_total=80.
All weights stored in `system_settings` table and editable via `/admin/settings`.

## Phase 3 Features (Merit Engine, Seat Matrix, Public Search)

- **Configurable Merit Formula**: weights stored in DB, editable live via admin settings page
- **Merit List Engine**: generate ranked lists per program/session/quota, publish, freeze, recalculate, export CSV
- **Seat Matrix**: per program+session seat allocation (open merit, minority, disability, NMU employee)
- **Public Merit Search**: `/merit-search` — no auth, search by CNIC or application number
- **Session Milestones**: correction window start/end, merit publication date, joining deadline
- **Student Merit Page**: shows detailed rank, merit score breakdown, status per published list

## Phase 4 Features (Analytics Dashboard + Joining Workflow)

- **Admin Dashboard Charts**: Two rows of 4 stat cards (8 KPIs) — Total Applications, Registered Students, Pending Payments, Joining Intents, Pending Verifications, Merit Listed, Admitted, Rejected. Recharts `BarChart` for Applications by Program (with admitted overlay). Recharts `PieChart` donut for Application Status Breakdown. Recent Activity feed (newest-first, max 10 items).
- **Student Dashboard Timeline**: Application status progress tracker rendered as a step-by-step pipeline (Draft → Submitted → Under Review → Verified → Merit Listed → Admitted). Merit badge banner shown when student has a rank. Joining confirmed banner when intent recorded.
- **Student Joining Intent**: Students on merit-listed/admitted applications can click "Confirm Intent to Join" button (on `/student/merit`). Records `joiningIntentAt` timestamp on the application. Admin dashboard "Joining Intents" card reflects count. Audit log entry created.
- **Student Merit Enhancements**: "Confirm Intent to Join" shown per merit entry if `status === "selected"`. Toast notification on success. Banner displayed if already confirmed.
- **Dashboard API Improvements**: Recent activity now sorted newest-first. Student summary returns `profileCompletion`, `meritRank`, `meritScore`, `joiningIntentConfirmed`, `joiningIntentAt`, `applicationStatuses[]`. Admin summary returns `joiningIntents`, `meritListedCount`, `totalJoined`.

## Phase 5 Features (Verification Desk + Finance Verification + Joined Students Management)

- **Verification Desk** (`/admin/verification`): Queue list of applications eligible for joining verification. Shows applicant name, app number, CNIC, program, merit score, joining intent status, checklist progress bar (8 items), and last decision badge. Clickable cards navigate to per-candidate page.
- **Per-Candidate Verification Page** (`/admin/verification/:applicationId`): Full detail view: personal profile, academic data, documents with preview links, challan payment cards with slip viewer, merit list rank. 8-item checklist (Name, CNIC, Domicile, Matric Marks, FSc Marks, Quota, Payment, Documents) — each item has status selector (Pending/Verified/Missing/Mismatch) and optional remarks. Checklist auto-initialised from `DEFAULT_CHECKLIST_ITEMS`. Save checklist + submit decision (Accept/Reject/Send Back) with guards.
- **Joining Decisions**: `accept_joining` requires all non-quota mandatory items verified; auto-inserts to `joined_students`. `reject_joining`/`send_back` require remarks. Decision history dialog shows all past decisions with officer names and timestamps.
- **Finance/Challan Page** (`/admin/challans`): Rebuilt with 4 stat cards, slip preview modal (renders `/api${paidSlipPath}` as image), verify/reject dialogs with remarks field, status filter + search.
- **Joined Students** (`/admin/students`): 3 stat cards (Total, Desk Verified, No Roll No.). Program/session filters, name/email search. Export CSV button. Per-row "Remove" opens a dialog requiring ≥10-char reason + "REMOVE" typed confirmation. Soft-delete sets `removedAt`, reverts application to rejected.
- **Checklist Schema**: `verificationChecklists` (JSONB items per application), `joiningDecisions` (decision history). `joinedStudents` extended with `verifiedById`, `verifierName`, `removedAt`, `removedById`, `removalReason`. `payment_challans` extended with `remarks`.
- **Sidebar Updates**: "Payment Verification" (was Challans), "Verification Desk" (was Verification), "Joined Students" (was Students).

## Phase 6 Features (Student UX Polish + Admin Applications Pipeline)

- **Student Applications Page**: Context-aware action panels for every status. `challan_generated` → pay + upload slip. `slip_uploaded` → final submit button. `merit_listed` → purple alert with link to merit page. `selected_for_verification` → sky blue alert with physical verification instructions (docs to bring, hours). `clarification_required` → orange alert with contact info. `admitted` → green congratulations alert. `rejected` → red alert with next-session suggestion.
- **Student Dashboard Timeline**: Extended to 7 steps: Draft → Submitted → Under Review → Verified → Merit Listed → Verification Desk → Admitted. `STEP_INDEX` maps all statuses (including `challan_generated`, `slip_uploaded`, `clarification_required`) to the correct step. `clarification_required` renders the Under Review step in orange with a `!` indicator. Inline contextual alert banners for clarification, selected_for_verification. Separate top-level banners for Admitted (green, PartyPopper), Clarification (orange), Selected for Verification (sky blue).
- **Admin Applications Pipeline**: `PIPELINE_ACTIONS` map drives all status transitions: submitted → start review / reject; under_review → reject / verify; verified → reject / add to merit list; merit_listed → **Route to Verification Desk** (sets `selected_for_verification`) / mark admitted; selected_for_verification → send back (clarification); clarification_required → restore to under_review / reject. Actions requiring remarks show a warning icon. Status filter includes all 11 statuses. Table row has "Desk" shortcut link for `selected_for_verification` and `admitted` rows.
- **API Bug Fix**: `verificationDesk.ts` merit list entries query now uses `applicationId` instead of the non-existent `userId` column — fixing 500 errors on the per-candidate verification desk page.
- **Sidebar enhancements**: Status badge record in all status-bearing components covers all 11 statuses consistently.

## Theme / Design

Deep navy institutional palette (primary: `222 47% 11%`), Plus Jakarta Sans font, clean and professional. Light mode only.

import { Router, type IRouter } from "express";
import { db, applicationsTable, usersTable, programsTable, admissionSessionsTable, studentProfilesTable, documentsTable, paymentChallansTable, meritListEntriesTable, meritListsTable, verificationChecklistsTable, joiningDecisionsTable, joinedStudentsTable, quotaCategoriesTable, notificationsTable } from "@workspace/db";
import { eq, and, or, desc } from "drizzle-orm";
import { DEFAULT_CHECKLIST_ITEMS } from "@workspace/db";
import { requireAuth, requireRoles } from "../middlewares/auth";
import { logAudit } from "../lib/audit";
import { sendEmail, buildDecisionEmail } from "../lib/email";

const router: IRouter = Router();

const DESK_ROLES = ["super_admin", "admission_admin", "verification_officer"];

async function buildCandidateDetail(applicationId: number) {
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId));
  if (!app) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));
  const [program] = await db.select().from(programsTable).where(eq(programsTable.id, app.programId));
  const [session] = await db.select().from(admissionSessionsTable).where(eq(admissionSessionsTable.id, app.sessionId));
  const [profile] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, app.userId));
  const [quota] = app.quotaId ? await db.select().from(quotaCategoriesTable).where(eq(quotaCategoriesTable.id, app.quotaId)) : [null];
  const documents = await db.select().from(documentsTable).where(eq(documentsTable.userId, app.userId));
  const challans = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.applicationId, app.id));
  const meritEntries = await db.select({
    id: meritListEntriesTable.id,
    rank: meritListEntriesTable.rank,
    meritScore: meritListEntriesTable.meritScore,
    meritScoreNormalized: meritListEntriesTable.meritScoreNormalized,
    status: meritListEntriesTable.status,
    meritListId: meritListEntriesTable.meritListId,
    meritListName: meritListsTable.name,
  }).from(meritListEntriesTable)
    .innerJoin(meritListsTable, eq(meritListEntriesTable.meritListId, meritListsTable.id))
    .where(eq(meritListEntriesTable.applicationId, applicationId));

  const [joiningDecision] = await db.select().from(joiningDecisionsTable)
    .where(eq(joiningDecisionsTable.applicationId, app.id))
    .orderBy(desc(joiningDecisionsTable.createdAt))
    .limit(1);

  const [checklist] = await db.select().from(verificationChecklistsTable).where(eq(verificationChecklistsTable.applicationId, app.id));

  const profileData: any = profile ? {
    id: profile.id,
    fatherName: profile.fatherName,
    cnic: profile.cnic,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    religion: profile.religion,
    nationality: profile.nationality,
    domicileDistrict: profile.domicileDistrict,
    domicileProvince: profile.domicileProvince,
    matricYear: profile.matricYear,
    matricBoard: profile.matricBoard,
    matricMarks: profile.matricMarks,
    matricTotalMarks: profile.matricTotalMarks,
    fscYear: profile.fscYear,
    fscBoard: profile.fscBoard,
    fscMarks: profile.fscMarks,
    fscTotalMarks: profile.fscTotalMarks,
    completionPercentage: profile.completionPercentage,
  } : null;

  return {
    application: {
      id: app.id,
      applicationNumber: app.applicationNumber,
      status: app.status,
      submittedAt: app.submittedAt?.toISOString() ?? null,
      meritScore: app.meritScore ?? null,
      meritScoreRaw: app.meritScoreRaw ?? null,
      meritBreakdown: app.meritBreakdown ?? null,
      joiningIntentAt: app.joiningIntentAt?.toISOString() ?? null,
      remarks: app.remarks ?? null,
    },
    user: user ? {
      id: user.id, email: user.email, fullName: user.fullName, phone: user.phone ?? null,
    } : null,
    program: program ? { id: program.id, name: program.name, code: program.code, duration: program.duration } : null,
    session: session ? { id: session.id, name: session.name } : null,
    quota: quota ? { id: quota.id, name: quota.name, code: quota.code } : null,
    profile: profileData,
    documents: documents.map((d) => ({
      id: d.id, docType: d.docType, fileName: d.fileName ?? null,
      filePath: d.filePath ?? null, fileUrl: d.fileUrl ?? null,
      mimeType: d.mimeType ?? null, status: d.status, uploadedAt: d.uploadedAt.toISOString(),
    })),
    challans: challans.map((c) => ({
      id: c.id, challanNumber: c.challanNumber, amount: c.amount, dueDate: c.dueDate,
      status: c.status, bankName: c.bankName ?? null, transactionRef: c.transactionRef ?? null,
      paidSlipPath: c.paidSlipPath ?? null, paidAt: c.paidAt?.toISOString() ?? null,
      remarks: (c as any).remarks ?? null,
    })),
    meritEntries,
    latestDecision: joiningDecision ? {
      id: joiningDecision.id, decision: joiningDecision.decision, remarks: joiningDecision.remarks ?? null,
      verifiedCount: joiningDecision.verifiedCount, totalCount: joiningDecision.totalCount,
      decidedAt: joiningDecision.decidedAt.toISOString(),
    } : null,
    checklistItems: checklist ? checklist.items : DEFAULT_CHECKLIST_ITEMS,
  };
}

router.get("/verification-desk", requireAuth, requireRoles(...DESK_ROLES), async (req, res): Promise<void> => {
  const search = req.query.search as string | undefined;
  const statusFilter = req.query.status as string | undefined;

  const eligibleStatuses = ["submitted", "under_review", "verified", "merit_listed", "admitted", "selected_for_verification", "clarification_required"];
  const whereStatuses = (statusFilter && eligibleStatuses.includes(statusFilter)) ? [statusFilter] : eligibleStatuses;

  let apps = await db.select().from(applicationsTable)
    .where(or(...whereStatuses.map((s) => eq(applicationsTable.status, s))))
    .orderBy(desc(applicationsTable.submittedAt));

  const results = await Promise.all(apps.slice(0, 100).map(async (app) => {
    const [user] = await db.select({ fullName: usersTable.fullName, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, app.userId));
    const [program] = await db.select({ name: programsTable.name, code: programsTable.code }).from(programsTable).where(eq(programsTable.id, app.programId));
    const [profile] = await db.select({ cnic: studentProfilesTable.cnic }).from(studentProfilesTable).where(eq(studentProfilesTable.userId, app.userId));
    const [checklist] = await db.select({ items: verificationChecklistsTable.items }).from(verificationChecklistsTable).where(eq(verificationChecklistsTable.applicationId, app.id));
    const items = (checklist?.items ?? DEFAULT_CHECKLIST_ITEMS) as any[];
    const verifiedCount = items.filter((i) => i.status === "verified").length;
    const [decision] = await db.select({ decision: joiningDecisionsTable.decision }).from(joiningDecisionsTable)
      .where(eq(joiningDecisionsTable.applicationId, app.id))
      .orderBy(desc(joiningDecisionsTable.createdAt)).limit(1);

    return {
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      status: app.status,
      submittedAt: app.submittedAt?.toISOString() ?? null,
      meritScore: app.meritScore ?? null,
      joiningIntentAt: app.joiningIntentAt?.toISOString() ?? null,
      user: user ?? null,
      program: program ?? null,
      cnic: profile?.cnic ?? null,
      verifiedCount,
      totalItems: items.length,
      latestDecision: decision?.decision ?? null,
    };
  }));

  const filtered = search
    ? results.filter((r) =>
        r.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.cnic?.includes(search)
      )
    : results;

  res.json(filtered);
});

router.get("/verification-desk/:applicationId", requireAuth, requireRoles(...DESK_ROLES), async (req, res): Promise<void> => {
  const applicationId = Number(req.params.applicationId);
  const detail = await buildCandidateDetail(applicationId);
  if (!detail) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(detail);
});

router.get("/verification-desk/:applicationId/checklist", requireAuth, requireRoles(...DESK_ROLES), async (req, res): Promise<void> => {
  const applicationId = Number(req.params.applicationId);
  const [checklist] = await db.select().from(verificationChecklistsTable).where(eq(verificationChecklistsTable.applicationId, applicationId));
  res.json({ items: checklist?.items ?? DEFAULT_CHECKLIST_ITEMS });
});

router.put("/verification-desk/:applicationId/checklist", requireAuth, requireRoles(...DESK_ROLES), async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const officerId = sess.userId as number;
  const applicationId = Number(req.params.applicationId);
  const { items } = req.body;
  if (!Array.isArray(items)) { res.status(400).json({ error: "items must be an array" }); return; }

  const [existing] = await db.select().from(verificationChecklistsTable).where(eq(verificationChecklistsTable.applicationId, applicationId));
  if (existing) {
    const [updated] = await db.update(verificationChecklistsTable)
      .set({ items, officerId, updatedAt: new Date() })
      .where(eq(verificationChecklistsTable.applicationId, applicationId))
      .returning();
    res.json({ items: updated.items });
  } else {
    const [created] = await db.insert(verificationChecklistsTable)
      .values({ applicationId, officerId, items })
      .returning();
    res.json({ items: created.items });
  }
});

router.post("/verification-desk/:applicationId/decision", requireAuth, requireRoles(...DESK_ROLES), async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const officerId = sess.userId as number;
  const applicationId = Number(req.params.applicationId);
  const { decision, remarks } = req.body;

  const validDecisions = ["accept_joining", "reject_joining", "send_back"];
  if (!validDecisions.includes(decision)) {
    res.status(400).json({ error: "Invalid decision value" });
    return;
  }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }

  const [checklist] = await db.select().from(verificationChecklistsTable).where(eq(verificationChecklistsTable.applicationId, applicationId));
  const items = (checklist?.items ?? DEFAULT_CHECKLIST_ITEMS) as any[];
  const verifiedCount = items.filter((i: any) => i.status === "verified").length;
  const totalCount = items.length;

  if (decision === "accept_joining") {
    const mandatoryItems = items.filter((i: any) => !["quota_valid"].includes(i.key));
    const allMandatoryVerified = mandatoryItems.every((i: any) => i.status === "verified");
    if (!allMandatoryVerified) {
      res.status(400).json({ error: `Cannot accept joining: ${verifiedCount}/${totalCount} items verified. All mandatory items must be verified.` });
      return;
    }
  }

  const [jd] = await db.insert(joiningDecisionsTable).values({
    applicationId,
    officerId,
    decision,
    checklistSnapshot: items,
    verifiedCount,
    totalCount,
    remarks: remarks ?? null,
  }).returning();

  const newStatus = decision === "accept_joining" ? "admitted"
    : decision === "reject_joining" ? "rejected"
    : "clarification_required";

  await db.update(applicationsTable).set({ status: newStatus }).where(eq(applicationsTable.id, applicationId));

  if (decision === "accept_joining") {
    const [officer] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, officerId));
    const existing = await db.select().from(joinedStudentsTable).where(eq(joinedStudentsTable.applicationId, applicationId));
    if (!existing.length) {
      await db.insert(joinedStudentsTable).values({
        applicationId,
        userId: app.userId,
        sessionId: app.sessionId,
        programId: app.programId,
        verifiedById: officerId,
        verifierName: officer?.fullName ?? null,
      });
    }
    await db.update(applicationsTable).set({ status: "admitted" }).where(eq(applicationsTable.id, applicationId));
  }

  await logAudit({ userId: officerId, action: `joining_decision_${decision}`, entityType: "application", entityId: applicationId });

  // --- In-app notification + email ---
  try {
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));
    const [prog] = await db.select().from(programsTable).where(eq(programsTable.id, app.programId));
    const appNumber = app.applicationNumber ?? `APP-${app.id}`;
    const programName = prog?.name ?? "Your Program";

    const notifMap: Record<string, { title: string; message: string; type: string }> = {
      accept_joining: {
        title: "Joining Accepted — Congratulations!",
        message: `Your joining documents for ${programName} (${appNumber}) have been verified and accepted. You are officially admitted.`,
        type: "success",
      },
      reject_joining: {
        title: "Application Rejected",
        message: `Your application for ${programName} (${appNumber}) has been rejected after document verification.${remarks ? " Remarks: " + remarks : ""} Please contact the admissions office for further guidance.`,
        type: "danger",
      },
      send_back: {
        title: "Clarification Required on Your Application",
        message: `Your application for ${programName} (${appNumber}) requires clarification.${remarks ? " Remarks: " + remarks : ""} Please log in and review your documents.`,
        type: "warning",
      },
    };

    const notif = notifMap[decision] ?? notifMap.send_back;

    await db.insert(notificationsTable).values({
      userId: app.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      relatedEntityType: "application",
      relatedEntityId: applicationId,
    });

    if (student?.email) {
      const emailContent = buildDecisionEmail({
        studentName: student.fullName,
        applicationNumber: appNumber,
        program: programName,
        decision,
        remarks: remarks ?? null,
      });
      await sendEmail({ to: student.email, ...emailContent });
    }
  } catch (notifErr) {
    console.error("[notification] Failed to send notification/email:", notifErr);
  }
  // --- end notification ---

  res.status(201).json({
    id: jd.id, decision: jd.decision, remarks: jd.remarks ?? null,
    verifiedCount: jd.verifiedCount, totalCount: jd.totalCount,
    decidedAt: jd.decidedAt.toISOString(),
    newStatus,
  });
});

router.get("/verification-desk/:applicationId/decisions", requireAuth, requireRoles(...DESK_ROLES), async (req, res): Promise<void> => {
  const applicationId = Number(req.params.applicationId);
  const decisions = await db.select().from(joiningDecisionsTable)
    .where(eq(joiningDecisionsTable.applicationId, applicationId))
    .orderBy(desc(joiningDecisionsTable.createdAt));

  const formatted = await Promise.all(decisions.map(async (d) => {
    const [officer] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, d.officerId));
    return {
      id: d.id, decision: d.decision, remarks: d.remarks ?? null,
      verifiedCount: d.verifiedCount, totalCount: d.totalCount,
      officerName: officer?.fullName ?? "Unknown",
      decidedAt: d.decidedAt.toISOString(),
    };
  }));

  res.json(formatted);
});

export default router;

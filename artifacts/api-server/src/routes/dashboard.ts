import { Router, type IRouter } from "express";
import { db, applicationsTable, usersTable, programsTable, admissionSessionsTable, paymentChallansTable, verificationDecisionsTable, noticesTable, auditLogsTable, joinedStudentsTable, meritListEntriesTable, studentProfilesTable } from "@workspace/db";
import { eq, count, and, sum, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/admin-summary", requireAuth, async (_req, res): Promise<void> => {
  const [
    totalApps,
    pendingApps,
    approvedApps,
    rejectedApps,
    totalStudents,
    totalPrograms,
    totalSessions,
    activeSessionResult,
    pendingPayments,
    pendingVerifications,
    joiningIntents,
    meritListedCount,
    totalJoined,
  ] = await Promise.all([
    db.select({ count: count() }).from(applicationsTable),
    db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.status, "submitted")),
    db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.status, "admitted")),
    db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.status, "rejected")),
    db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "student")),
    db.select({ count: count() }).from(programsTable),
    db.select({ count: count() }).from(admissionSessionsTable),
    db.select({ name: admissionSessionsTable.name }).from(admissionSessionsTable).where(eq(admissionSessionsTable.isActive, true)).limit(1),
    db.select({ count: count() }).from(paymentChallansTable).where(eq(paymentChallansTable.status, "pending")),
    db.select({ count: count() }).from(verificationDecisionsTable).where(eq(verificationDecisionsTable.status, "pending")),
    db.select({ count: count() }).from(applicationsTable).where(sql`joining_intent_at IS NOT NULL`),
    db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.status, "merit_listed")),
    db.select({ count: count() }).from(joinedStudentsTable),
  ]);

  res.json({
    totalApplications: Number(totalApps[0]?.count ?? 0),
    pendingApplications: Number(pendingApps[0]?.count ?? 0),
    approvedApplications: Number(approvedApps[0]?.count ?? 0),
    rejectedApplications: Number(rejectedApps[0]?.count ?? 0),
    totalStudents: Number(totalStudents[0]?.count ?? 0),
    totalPrograms: Number(totalPrograms[0]?.count ?? 0),
    totalSessions: Number(totalSessions[0]?.count ?? 0),
    activeSession: activeSessionResult[0]?.name ?? null,
    pendingPayments: Number(pendingPayments[0]?.count ?? 0),
    pendingVerifications: Number(pendingVerifications[0]?.count ?? 0),
    joiningIntents: Number(joiningIntents[0]?.count ?? 0),
    meritListedCount: Number(meritListedCount[0]?.count ?? 0),
    totalJoined: Number(totalJoined[0]?.count ?? 0),
  });
});

router.get("/dashboard/student-summary", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;

  const userApps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId));
  const appIds = userApps.map((a) => a.id);

  const [
    pendingApps,
    approvedApps,
    activeNotices,
    profileResult,
    joiningIntentApp,
  ] = await Promise.all([
    db.select({ count: count() }).from(applicationsTable).where(and(eq(applicationsTable.userId, userId), eq(applicationsTable.status, "submitted"))),
    db.select({ count: count() }).from(applicationsTable).where(and(eq(applicationsTable.userId, userId), eq(applicationsTable.status, "admitted"))),
    db.select({ count: count() }).from(noticesTable).where(eq(noticesTable.isActive, true)),
    db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, userId)).limit(1),
    db.select({ joiningIntentAt: applicationsTable.joiningIntentAt, id: applicationsTable.id }).from(applicationsTable)
      .where(and(eq(applicationsTable.userId, userId), sql`joining_intent_at IS NOT NULL`)).limit(1),
  ]);

  const pendingChallans = appIds.length
    ? await db.select({ count: count() }).from(paymentChallansTable)
        .where(and(eq(paymentChallansTable.status, "pending"), sql`application_id = ANY(ARRAY[${sql.raw(appIds.join(",") || "0")}])`))
    : [{ count: 0 }];

  const meritEntries = appIds.length
    ? await db.select({
        rank: meritListEntriesTable.rank,
        meritScore: meritListEntriesTable.meritScore,
      }).from(meritListEntriesTable)
        .where(sql`application_id = ANY(ARRAY[${sql.raw(appIds.join(","))}])`)
        .orderBy(meritListEntriesTable.rank)
        .limit(1)
    : [];

  const bestRank = meritEntries[0]?.rank ?? null;
  const bestScore = meritEntries[0]?.meritScore ?? null;

  res.json({
    totalApplications: userApps.length,
    pendingApplications: Number(pendingApps[0]?.count ?? 0),
    approvedApplications: Number(approvedApps[0]?.count ?? 0),
    pendingPayments: Number(pendingChallans[0]?.count ?? 0),
    pendingDocuments: 0,
    activeNotices: Number(activeNotices[0]?.count ?? 0),
    profileCompletion: (() => {
      const p = profileResult[0];
      if (!p) return 0;
      const strFields = [p.fatherName, p.dateOfBirth, p.gender, p.cnic, p.religion, p.domicileDistrict, p.matricBoard, p.interBoard];
      const numFields = [p.matricYear, p.matricTotal, p.matricMarks, p.interYear, p.interTotal, p.interMarks];
      const strFilled = strFields.filter((f) => f !== null && f !== undefined && f !== "").length;
      const numFilled = numFields.filter((f) => f !== null && f !== undefined && Number(f) > 0).length;
      return Math.round(((strFilled + numFilled) / (strFields.length + numFields.length)) * 100);
    })(),
    meritRank: bestRank,
    meritScore: bestScore,
    joiningIntentConfirmed: joiningIntentApp.length > 0,
    joiningIntentAt: joiningIntentApp[0]?.joiningIntentAt?.toISOString() ?? null,
    applicationStatuses: userApps.map((a) => ({ id: a.id, status: a.status, applicationNumber: a.applicationNumber })),
  });
});

router.get("/dashboard/application-stats", requireAuth, async (_req, res): Promise<void> => {
  const programs = await db.select().from(programsTable);
  const byProgram = await Promise.all(programs.map(async (p) => {
    const [total, approved] = await Promise.all([
      db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.programId, p.id)),
      db.select({ count: count() }).from(applicationsTable).where(and(eq(applicationsTable.programId, p.id), eq(applicationsTable.status, "admitted"))),
    ]);
    return {
      programName: p.name,
      programCode: p.code,
      count: Number(total[0]?.count ?? 0),
      approved: Number(approved[0]?.count ?? 0),
    };
  }));

  const statuses = ["draft", "submitted", "under_review", "verified", "rejected", "merit_listed", "admitted"];
  const byStatus = await Promise.all(statuses.map(async (status) => {
    const [result] = await db.select({ count: count() }).from(applicationsTable).where(eq(applicationsTable.status, status));
    return { status, count: Number(result?.count ?? 0) };
  }));

  res.json({ byProgram, byStatus });
});

router.get("/dashboard/recent-activity", requireAuth, async (_req, res): Promise<void> => {
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(20);

  const items = await Promise.all(logs.map(async (l) => {
    let userName: string | null = null;
    if (l.userId) {
      const [user] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, l.userId));
      userName = user?.fullName ?? null;
    }
    return {
      id: l.id,
      action: l.action,
      description: `${l.action.replace(/_/g, " ")} on ${l.entityType}${l.entityId ? ` #${l.entityId}` : ""}`,
      entityType: l.entityType,
      userId: l.userId ?? null,
      userName,
      createdAt: l.createdAt.toISOString(),
    };
  }));

  res.json(items);
});

export default router;

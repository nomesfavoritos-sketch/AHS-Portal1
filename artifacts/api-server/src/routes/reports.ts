import { Router, type IRouter } from "express";
import { db, applicationsTable, programsTable, paymentChallansTable, joinedStudentsTable, admissionSessionsTable, quotaCategoriesTable } from "@workspace/db";
import { eq, sql, count, sum } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/reports/summary", requireAuth, requireRoles("super_admin", "admission_admin"), async (_req, res): Promise<void> => {
  const programs = await db.select().from(programsTable);
  const sessions = await db.select().from(admissionSessionsTable);
  const quotas = await db.select().from(quotaCategoriesTable);

  const allApps = await db.select({
    id: applicationsTable.id,
    status: applicationsTable.status,
    programId: applicationsTable.programId,
    sessionId: applicationsTable.sessionId,
    quotaId: applicationsTable.quotaId,
  }).from(applicationsTable);

  const allChallans = await db.select({
    status: paymentChallansTable.status,
    amount: paymentChallansTable.amount,
    paidAt: paymentChallansTable.paidAt,
  }).from(paymentChallansTable);

  const allJoined = await db.select({
    programId: joinedStudentsTable.programId,
  }).from(joinedStudentsTable).where(sql`removed_at IS NULL`);

  const programMap: Record<number, { id: number; name: string; code: string }> = {};
  for (const p of programs) programMap[p.id] = { id: p.id, name: p.name, code: p.code };

  const sessionMap: Record<number, string> = {};
  for (const s of sessions) sessionMap[s.id] = s.name;

  const quotaMap: Record<number, string> = {};
  for (const q of quotas) quotaMap[q.id] = q.name;

  const byProgram: Record<number, Record<string, number> & { programId: number; programName: string; programCode: string }> = {};
  for (const p of programs) {
    byProgram[p.id] = { programId: p.id, programName: p.name, programCode: p.code, total: 0, draft: 0, submitted: 0, under_review: 0, verified: 0, merit_listed: 0, selected_for_verification: 0, admitted: 0, rejected: 0, clarification_required: 0 };
  }

  const byStatus: Record<string, number> = {};
  const bySession: Record<number, number> = {};
  const byQuota: Record<string, number> = { open_merit: 0 };
  for (const q of quotas) byQuota[q.name] = 0;

  for (const app of allApps) {
    if (byProgram[app.programId]) {
      byProgram[app.programId].total++;
      byProgram[app.programId][app.status] = (byProgram[app.programId][app.status] ?? 0) + 1;
    }
    byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
    if (app.sessionId) bySession[app.sessionId] = (bySession[app.sessionId] ?? 0) + 1;
    if (app.quotaId) {
      const qName = quotaMap[app.quotaId] ?? "Other";
      byQuota[qName] = (byQuota[qName] ?? 0) + 1;
    } else {
      byQuota["open_merit"] = (byQuota["open_merit"] ?? 0) + 1;
    }
  }

  const byJoinedProgram: Record<number, number> = {};
  for (const j of allJoined) {
    byJoinedProgram[j.programId] = (byJoinedProgram[j.programId] ?? 0) + 1;
  }

  const challanSummary = {
    total: allChallans.length,
    paid: allChallans.filter(c => c.status === "paid").length,
    pending: allChallans.filter(c => c.status === "pending").length,
    rejected: allChallans.filter(c => c.status === "rejected").length,
    totalRevenue: allChallans
      .filter(c => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0),
  };

  res.json({
    applicationsByProgram: Object.values(byProgram).sort((a, b) => b.total - a.total),
    applicationsByStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    applicationsByQuota: Object.entries(byQuota).map(([quotaName, count]) => ({ quotaName, count })).filter(q => q.count > 0).sort((a, b) => b.count - a.count),
    challanSummary,
    joinedByProgram: Object.entries(byJoinedProgram).map(([programId, count]) => ({
      programId: Number(programId),
      programName: programMap[Number(programId)]?.name ?? "Unknown",
      count,
    })).sort((a, b) => b.count - a.count),
    sessionSummary: Object.entries(bySession).map(([sessionId, total]) => ({
      sessionId: Number(sessionId),
      sessionName: sessionMap[Number(sessionId)] ?? "Unknown",
      total,
    })).sort((a, b) => b.total - a.total),
    totals: {
      total: allApps.length,
      admitted: byStatus["admitted"] ?? 0,
      rejected: byStatus["rejected"] ?? 0,
      meritListed: byStatus["merit_listed"] ?? 0,
      totalJoined: allJoined.length,
      totalRevenue: challanSummary.totalRevenue,
    },
  });
});

export default router;

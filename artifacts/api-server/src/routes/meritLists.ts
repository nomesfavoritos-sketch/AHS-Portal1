import { Router, type IRouter } from "express";
import { db, meritListsTable, meritListEntriesTable, applicationsTable, usersTable, programsTable, admissionSessionsTable, studentProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateMeritListBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmtList = (m: typeof meritListsTable.$inferSelect) => ({
  id: m.id,
  name: m.name,
  sessionId: m.sessionId,
  programId: m.programId,
  publishedAt: m.publishedAt ? m.publishedAt.toISOString() : null,
  isPublished: m.isPublished,
  totalEntries: m.totalEntries,
  createdAt: m.createdAt.toISOString(),
});

router.get("/merit-lists", requireAuth, async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.sessionId) conditions.push(eq(meritListsTable.sessionId, Number(req.query.sessionId)));
  if (req.query.programId) conditions.push(eq(meritListsTable.programId, Number(req.query.programId)));
  const where = conditions.length ? and(...conditions) : undefined;
  const lists = await db.select().from(meritListsTable).where(where).orderBy(meritListsTable.createdAt);
  res.json(lists.map(fmtList));
});

router.post("/merit-lists", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const parsed = CreateMeritListBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, sessionId, programId } = parsed.data;

  // Get verified applications for this session/program and compute merit scores
  const apps = await db.select({
    app: applicationsTable,
    profile: studentProfilesTable,
  })
    .from(applicationsTable)
    .leftJoin(studentProfilesTable, eq(applicationsTable.userId, studentProfilesTable.userId))
    .where(and(
      eq(applicationsTable.sessionId, sessionId),
      eq(applicationsTable.programId, programId),
      eq(applicationsTable.status, "verified"),
    ));

  const [meritList] = await db.insert(meritListsTable).values({
    name,
    sessionId,
    programId,
    totalEntries: apps.length,
  }).returning();

  // Calculate merit score: 10% matric + 40% inter
  const ranked = apps.map(({ app, profile }) => {
    const matricPct = profile && profile.matricTotal ? (profile.matricMarks ?? 0) / profile.matricTotal * 100 : 0;
    const interPct = profile && profile.interTotal ? (profile.interMarks ?? 0) / profile.interTotal * 100 : 0;
    const meritScore = (matricPct * 0.1) + (interPct * 0.4);
    return { appId: app.id, meritScore };
  }).sort((a, b) => b.meritScore - a.meritScore);

  if (ranked.length > 0) {
    await db.insert(meritListEntriesTable).values(
      ranked.map(({ appId, meritScore }, idx) => ({
        meritListId: meritList.id,
        applicationId: appId,
        rank: idx + 1,
        meritScore,
        status: "selected",
      }))
    );
  }

  res.status(201).json(fmtList(meritList));
});

router.get("/merit-lists/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [meritList] = await db.select().from(meritListsTable).where(eq(meritListsTable.id, id));
  if (!meritList) {
    res.status(404).json({ error: "Merit list not found" });
    return;
  }

  const entries = await db.select().from(meritListEntriesTable).where(eq(meritListEntriesTable.meritListId, id)).orderBy(meritListEntriesTable.rank);

  const entriesFormatted = await Promise.all(entries.map(async (e) => {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, e.applicationId));
    const [user] = app ? await db.select().from(usersTable).where(eq(usersTable.id, app.userId)) : [];
    const [program] = app ? await db.select().from(programsTable).where(eq(programsTable.id, app.programId)) : [];
    const [session] = app ? await db.select().from(admissionSessionsTable).where(eq(admissionSessionsTable.id, app.sessionId)) : [];
    return {
      id: e.id,
      meritListId: e.meritListId,
      applicationId: e.applicationId,
      rank: e.rank,
      meritScore: e.meritScore,
      status: e.status,
      application: app ? {
        id: app.id,
        applicationNumber: app.applicationNumber,
        userId: app.userId,
        sessionId: app.sessionId,
        programId: app.programId,
        quotaId: app.quotaId ?? null,
        status: app.status,
        remarks: app.remarks ?? null,
        submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        user: user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone ?? null, isActive: user.isActive, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() } : null,
        program: program ? { id: program.id, name: program.name, code: program.code, duration: program.duration, seats: program.seats, description: program.description ?? null, isActive: program.isActive, createdAt: program.createdAt.toISOString() } : null,
        session: session ? { id: session.id, name: session.name, year: session.year, startDate: session.startDate, endDate: session.endDate, isActive: session.isActive, status: session.status, createdAt: session.createdAt.toISOString() } : null,
      } : null,
    };
  }));

  res.json({ ...fmtList(meritList), entries: entriesFormatted });
});

export default router;

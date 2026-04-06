import { Router, type IRouter } from "express";
import { db, applicationsTable, usersTable, programsTable, admissionSessionsTable } from "@workspace/db";
import { eq, and, ilike, count } from "drizzle-orm";
import { CreateApplicationBody, UpdateApplicationBody, UpdateApplicationStatusBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

function generateApplicationNumber(): string {
  return `AHS-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
}

async function formatApplication(app: typeof applicationsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));
  const [program] = await db.select().from(programsTable).where(eq(programsTable.id, app.programId));
  const [session] = await db.select().from(admissionSessionsTable).where(eq(admissionSessionsTable.id, app.sessionId));
  return {
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
    user: user ? {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    } : null,
    program: program ? {
      id: program.id,
      name: program.name,
      code: program.code,
      duration: program.duration,
      seats: program.seats,
      description: program.description ?? null,
      isActive: program.isActive,
      createdAt: program.createdAt.toISOString(),
    } : null,
    session: session ? {
      id: session.id,
      name: session.name,
      year: session.year,
      startDate: session.startDate,
      endDate: session.endDate,
      isActive: session.isActive,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
    } : null,
  };
}

router.get("/applications", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const userRole = sess.userRole as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userRole === "student") conditions.push(eq(applicationsTable.userId, userId));
  if (req.query.sessionId) conditions.push(eq(applicationsTable.sessionId, Number(req.query.sessionId)));
  if (req.query.programId) conditions.push(eq(applicationsTable.programId, Number(req.query.programId)));
  if (req.query.status) conditions.push(eq(applicationsTable.status, req.query.status as string));

  const where = conditions.length ? and(...conditions) : undefined;

  const [applications, totalResult] = await Promise.all([
    db.select().from(applicationsTable).where(where).limit(limit).offset(offset).orderBy(applicationsTable.createdAt),
    db.select({ count: count() }).from(applicationsTable).where(where),
  ]);

  const formatted = await Promise.all(applications.map(formatApplication));

  res.json({
    applications: formatted,
    total: Number(totalResult[0]?.count ?? 0),
    page,
    limit,
  });
});

router.post("/applications", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const applicationNumber = generateApplicationNumber();
  const [app] = await db.insert(applicationsTable).values({
    ...parsed.data,
    userId,
    applicationNumber,
    status: "submitted",
    submittedAt: new Date(),
  }).returning();

  await logAudit({
    userId,
    action: "application_submitted",
    entityType: "application",
    entityId: app.id,
    ipAddress: req.ip,
  });

  const formatted = await formatApplication(app);
  res.status(201).json(formatted);
});

router.get("/applications/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const formatted = await formatApplication(app);
  res.json(formatted);
});

router.patch("/applications/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Partial<typeof applicationsTable.$inferInsert> = {};
  if (parsed.data.programId != null) updateData.programId = parsed.data.programId;
  if (parsed.data.quotaId !== undefined) updateData.quotaId = parsed.data.quotaId ?? undefined;
  if (parsed.data.remarks !== undefined) updateData.remarks = parsed.data.remarks ?? undefined;

  const [app] = await db.update(applicationsTable).set(updateData).where(eq(applicationsTable.id, id)).returning();
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const formatted = await formatApplication(app);
  res.json(formatted);
});

router.patch("/applications/:id/status", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const parsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [app] = await db.update(applicationsTable).set({
    status: parsed.data.status,
    remarks: parsed.data.remarks ?? undefined,
  }).where(eq(applicationsTable.id, id)).returning();
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  await logAudit({
    userId,
    action: `application_status_${parsed.data.status}`,
    entityType: "application",
    entityId: id,
    ipAddress: req.ip,
  });
  const formatted = await formatApplication(app);
  res.json(formatted);
});

export default router;

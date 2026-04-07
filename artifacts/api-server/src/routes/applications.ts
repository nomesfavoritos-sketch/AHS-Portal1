import { Router, type IRouter } from "express";
import { db, applicationsTable, usersTable, programsTable, admissionSessionsTable, paymentChallansTable, studentProfilesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { CreateApplicationBody, UpdateApplicationBody, UpdateApplicationStatusBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `AHS-${year}-${rand}`;
}

function generateChallanNumber(): string {
  return `CHN-${Date.now()}-${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
}

async function formatApplication(app: typeof applicationsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));
  const [program] = await db.select().from(programsTable).where(eq(programsTable.id, app.programId));
  const [session] = await db.select().from(admissionSessionsTable).where(eq(admissionSessionsTable.id, app.sessionId));
  const challans = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.applicationId, app.id));
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
    user: user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone ?? null, isActive: user.isActive, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() } : null,
    program: program ? { id: program.id, name: program.name, code: program.code, duration: program.duration, seats: program.seats, description: program.description ?? null, isActive: program.isActive, createdAt: program.createdAt.toISOString() } : null,
    session: session ? { id: session.id, name: session.name, year: session.year, startDate: session.startDate, endDate: session.endDate, isActive: session.isActive, status: session.status, createdAt: session.createdAt.toISOString() } : null,
    challan: challans[0] ? {
      id: challans[0].id,
      challanNumber: challans[0].challanNumber,
      amount: challans[0].amount,
      dueDate: challans[0].dueDate,
      status: challans[0].status,
      paidSlipPath: challans[0].paidSlipPath ?? null,
      paidAt: challans[0].paidAt ? challans[0].paidAt.toISOString() : null,
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

  // Block if profile is not sufficiently complete
  const [profile] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, userId));
  if (!profile || (profile.completionPercentage ?? 0) < 100) {
    res.status(400).json({
      error: "Your profile must be 100% complete before you can submit an application. Please complete your profile first.",
    });
    return;
  }

  const [existing] = await db.select().from(applicationsTable).where(
    and(
      eq(applicationsTable.userId, userId),
      eq(applicationsTable.programId, parsed.data.programId),
      eq(applicationsTable.sessionId, parsed.data.sessionId),
    )
  );
  if (existing) {
    res.status(409).json({ error: "You have already applied for this program in this session" });
    return;
  }

  const applicationNumber = generateApplicationNumber();
  const [app] = await db.insert(applicationsTable).values({
    ...parsed.data,
    userId,
    applicationNumber,
    status: "draft",
  }).returning();

  await logAudit({ userId, action: "application_created", entityType: "application", entityId: app.id, ipAddress: req.ip });

  const formatted = await formatApplication(app);
  res.status(201).json(formatted);
});

router.get("/applications/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(await formatApplication(app));
});

router.post("/applications/:id/generate-challan", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const id = parseInt(req.params.id as string, 10);

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  if (app.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (app.status !== "draft") { res.status(400).json({ error: "Challan can only be generated for draft applications" }); return; }

  const [existingChallan] = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.applicationId, id));
  if (existingChallan) { res.json(existingChallan); return; }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const [challan] = await db.insert(paymentChallansTable).values({
    applicationId: id,
    challanNumber: generateChallanNumber(),
    amount: 500,
    dueDate: dueDate.toISOString().split("T")[0],
    status: "pending",
  }).returning();

  await db.update(applicationsTable).set({ status: "challan_generated" }).where(eq(applicationsTable.id, id));
  await logAudit({ userId, action: "challan_generated", entityType: "application", entityId: id, ipAddress: req.ip });

  res.status(201).json({
    id: challan.id, challanNumber: challan.challanNumber, applicationId: challan.applicationId,
    amount: challan.amount, dueDate: challan.dueDate, status: challan.status,
    paidSlipPath: null, paidAt: null, createdAt: challan.createdAt.toISOString(),
  });
});

router.post("/applications/:id/upload-slip", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const id = parseInt(req.params.id as string, 10);

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  if (app.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { paidSlipPath } = req.body;
  if (!paidSlipPath) { res.status(400).json({ error: "paidSlipPath is required" }); return; }

  const [challan] = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.applicationId, id));
  if (!challan) { res.status(404).json({ error: "Challan not found" }); return; }

  const [updated] = await db.update(paymentChallansTable).set({
    paidSlipPath,
    paidSlipUploadedAt: new Date(),
    status: "slip_uploaded",
  }).where(eq(paymentChallansTable.id, challan.id)).returning();

  await db.update(applicationsTable).set({ status: "slip_uploaded" }).where(eq(applicationsTable.id, id));
  await logAudit({ userId, action: "slip_uploaded", entityType: "application", entityId: id, ipAddress: req.ip });

  res.json({
    id: updated.id, challanNumber: updated.challanNumber, applicationId: updated.applicationId,
    amount: updated.amount, dueDate: updated.dueDate, status: updated.status,
    paidSlipPath: updated.paidSlipPath ?? null, paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.post("/applications/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const id = parseInt(req.params.id as string, 10);

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  if (app.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  if (!["slip_uploaded"].includes(app.status)) {
    res.status(400).json({ error: `Upload a paid challan slip before submitting. Current status: ${app.status}` });
    return;
  }

  const [challan] = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.applicationId, id));
  if (!challan || !challan.paidSlipPath) {
    res.status(400).json({ error: "You must upload the fee payment slip before submitting your application." });
    return;
  }

  const [profile] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, userId));
  if (!profile || (profile.completionPercentage ?? 0) < 100) {
    res.status(400).json({ error: "Your profile must be 100% complete before submitting. Please complete your profile first." });
    return;
  }

  const [updated] = await db.update(applicationsTable).set({ status: "submitted", submittedAt: new Date() }).where(eq(applicationsTable.id, id)).returning();
  await logAudit({ userId, action: "application_submitted", entityType: "application", entityId: id, ipAddress: req.ip });

  res.json(await formatApplication(updated));
});

router.get("/applications/:id/summary", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const userRole = sess.userRole as string;
  const id = parseInt(req.params.id as string, 10);

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  if (userRole === "student" && app.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [profile] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, app.userId));
  const formatted = await formatApplication(app);
  res.json({ ...formatted, profile: profile ?? null });
});

router.patch("/applications/:id", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const userRole = sess.userRole as string;
  const id = parseInt(req.params.id as string, 10);

  const [existing] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Application not found" }); return; }
  if (userRole === "student" && existing.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (userRole === "student" && existing.status === "submitted") { res.status(400).json({ error: "Cannot edit a submitted application" }); return; }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Partial<typeof applicationsTable.$inferInsert> = {};
  if (parsed.data.programId != null) updateData.programId = parsed.data.programId;
  if (parsed.data.quotaId !== undefined) updateData.quotaId = parsed.data.quotaId ?? undefined;
  if (parsed.data.remarks !== undefined) updateData.remarks = parsed.data.remarks ?? undefined;

  const [app] = await db.update(applicationsTable).set(updateData).where(eq(applicationsTable.id, id)).returning();
  res.json(await formatApplication(app));
});

router.patch("/applications/:id/status", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const parsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [app] = await db.update(applicationsTable).set({
    status: parsed.data.status,
    remarks: parsed.data.remarks ?? undefined,
  }).where(eq(applicationsTable.id, id)).returning();
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }

  await logAudit({ userId, action: `application_status_${parsed.data.status}`, entityType: "application", entityId: id, ipAddress: req.ip });
  res.json(await formatApplication(app));
});

router.post("/applications/:id/joining-intent", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const id = Number(req.params.id);

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  if (app.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!["merit_listed", "admitted"].includes(app.status)) {
    res.status(400).json({ error: "Joining intent can only be confirmed for merit-listed or admitted applications" });
    return;
  }

  const [updated] = await db.update(applicationsTable)
    .set({ joiningIntentAt: new Date() })
    .where(eq(applicationsTable.id, id))
    .returning();

  await logAudit({ userId, action: "joining_intent_confirmed", entityType: "application", entityId: id, ipAddress: req.ip });
  res.json({ success: true, joiningIntentAt: updated.joiningIntentAt?.toISOString() });
});

export default router;

import { Router, type IRouter } from "express";
import { db, paymentChallansTable, applicationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { UpdateChallanStatusBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (c: typeof paymentChallansTable.$inferSelect) => ({
  id: c.id,
  challanNumber: c.challanNumber,
  applicationId: c.applicationId,
  amount: c.amount,
  dueDate: c.dueDate,
  status: c.status,
  paidAt: c.paidAt ? c.paidAt.toISOString() : null,
  bankName: c.bankName ?? null,
  transactionRef: c.transactionRef ?? null,
  paidSlipPath: c.paidSlipPath ?? null,
  paidSlipUploadedAt: c.paidSlipUploadedAt ? c.paidSlipUploadedAt.toISOString() : null,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

router.get("/challans", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const userRole = sess.userRole as string;

  const conditions = [];
  if (req.query.applicationId) conditions.push(eq(paymentChallansTable.applicationId, Number(req.query.applicationId)));
  if (req.query.status) conditions.push(eq(paymentChallansTable.status, req.query.status as string));

  const where = conditions.length ? and(...conditions) : undefined;
  let challans = await db.select().from(paymentChallansTable).where(where).orderBy(paymentChallansTable.createdAt);

  // For students, filter to only their challans
  if (userRole === "student") {
    const userApps = await db.select({ id: applicationsTable.id }).from(applicationsTable).where(eq(applicationsTable.userId, userId));
    const appIds = new Set(userApps.map(a => a.id));
    challans = challans.filter(c => appIds.has(c.applicationId));
  }

  res.json(challans.map(fmt));
});

router.get("/challans/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [challan] = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.id, id));
  if (!challan) { res.status(404).json({ error: "Challan not found" }); return; }
  res.json(fmt(challan));
});

/* ── Student: upload paid-slip path after paying at bank ── */
router.post("/challans/:id/paid-slip", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const userRole = sess.userRole as string;
  const id = parseInt(req.params.id as string, 10);
  const { paidSlipPath } = req.body as { paidSlipPath: string };

  if (!paidSlipPath) { res.status(400).json({ error: "paidSlipPath is required" }); return; }

  const [challan] = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.id, id));
  if (!challan) { res.status(404).json({ error: "Challan not found" }); return; }

  // Students may only update their own challans
  if (userRole === "student") {
    const [app] = await db.select({ userId: applicationsTable.userId }).from(applicationsTable).where(eq(applicationsTable.id, challan.applicationId));
    if (!app || app.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  const [updated] = await db
    .update(paymentChallansTable)
    .set({ paidSlipPath, paidSlipUploadedAt: new Date(), status: "submitted", updatedAt: new Date() })
    .where(eq(paymentChallansTable.id, id))
    .returning();

  // Advance application status to slip_uploaded
  await db
    .update(applicationsTable)
    .set({ status: "slip_uploaded", updatedAt: new Date() })
    .where(eq(applicationsTable.id, challan.applicationId));

  res.json(fmt(updated));
});

router.patch("/challans/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const parsed = UpdateChallanStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Partial<typeof paymentChallansTable.$inferInsert> = { status: parsed.data.status };
  if (parsed.data.status === "paid" || parsed.data.status === "verified") {
    updateData.paidAt = new Date();
  }
  if (parsed.data.bankName) updateData.bankName = parsed.data.bankName;
  if (parsed.data.transactionRef) updateData.transactionRef = parsed.data.transactionRef;
  if ((parsed.data as any).remarks) (updateData as any).remarks = (parsed.data as any).remarks;

  const [challan] = await db.update(paymentChallansTable).set(updateData).where(eq(paymentChallansTable.id, id)).returning();
  if (!challan) { res.status(404).json({ error: "Challan not found" }); return; }

  // Update application status when challan verified
  if (parsed.data.status === "verified") {
    await db.update(applicationsTable).set({ status: "under_review" }).where(eq(applicationsTable.id, challan.applicationId));
  }

  res.json(fmt(challan));
});

export default router;

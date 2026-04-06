import { Router, type IRouter } from "express";
import { db, paymentChallansTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateChallanBody, UpdateChallanStatusBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

function generateChallanNumber(): string {
  return `CHN-${Date.now()}-${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
}

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
  createdAt: c.createdAt.toISOString(),
});

router.get("/challans", requireAuth, async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.applicationId) conditions.push(eq(paymentChallansTable.applicationId, Number(req.query.applicationId)));
  if (req.query.status) conditions.push(eq(paymentChallansTable.status, req.query.status as string));
  const where = conditions.length ? and(...conditions) : undefined;
  const challans = await db.select().from(paymentChallansTable).where(where).orderBy(paymentChallansTable.createdAt);
  res.json(challans.map(fmt));
});

router.post("/challans", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const parsed = CreateChallanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const challanNumber = generateChallanNumber();
  const [challan] = await db.insert(paymentChallansTable).values({
    ...parsed.data,
    challanNumber,
    bankName: parsed.data.bankName ?? undefined,
  }).returning();
  res.status(201).json(fmt(challan));
});

router.get("/challans/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [challan] = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.id, id));
  if (!challan) {
    res.status(404).json({ error: "Challan not found" });
    return;
  }
  res.json(fmt(challan));
});

router.patch("/challans/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateChallanStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Partial<typeof paymentChallansTable.$inferInsert> = { status: parsed.data.status };
  if (parsed.data.status === "paid" || parsed.data.status === "verified") {
    updateData.paidAt = new Date();
  }
  const [challan] = await db.update(paymentChallansTable).set(updateData).where(eq(paymentChallansTable.id, id)).returning();
  if (!challan) {
    res.status(404).json({ error: "Challan not found" });
    return;
  }
  res.json(fmt(challan));
});

export default router;

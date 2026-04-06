import { Router, type IRouter } from "express";
import { db, verificationDecisionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateVerificationBody } from "@workspace/api-zod";
import { requireAuth, requireRoles } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (v: typeof verificationDecisionsTable.$inferSelect) => ({
  id: v.id,
  applicationId: v.applicationId,
  officerId: v.officerId,
  status: v.status,
  remarks: v.remarks ?? null,
  verifiedAt: v.verifiedAt.toISOString(),
  createdAt: v.createdAt.toISOString(),
});

router.get("/verifications", requireAuth, requireRoles("super_admin", "admission_admin", "verification_officer"), async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.applicationId) conditions.push(eq(verificationDecisionsTable.applicationId, Number(req.query.applicationId)));
  if (req.query.status) conditions.push(eq(verificationDecisionsTable.status, req.query.status as string));
  const where = conditions.length ? and(...conditions) : undefined;
  const verifications = await db.select().from(verificationDecisionsTable).where(where).orderBy(verificationDecisionsTable.createdAt);
  res.json(verifications.map(fmt));
});

router.post("/verifications", requireAuth, requireRoles("super_admin", "admission_admin", "verification_officer"), async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const officerId = sess.userId as number;
  const parsed = CreateVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [v] = await db.insert(verificationDecisionsTable).values({
    applicationId: parsed.data.applicationId,
    officerId,
    status: parsed.data.status,
    remarks: parsed.data.remarks ?? undefined,
  }).returning();
  res.status(201).json(fmt(v));
});

export default router;

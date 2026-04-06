import { Router, type IRouter } from "express";
import { db, quotaCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateQuotaBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (q: typeof quotaCategoriesTable.$inferSelect) => ({
  id: q.id,
  name: q.name,
  code: q.code,
  percentage: q.percentage,
  description: q.description ?? null,
  isActive: q.isActive,
  createdAt: q.createdAt.toISOString(),
});

router.get("/quotas", async (_req, res): Promise<void> => {
  const quotas = await db.select().from(quotaCategoriesTable).orderBy(quotaCategoriesTable.name);
  res.json(quotas.map(fmt));
});

router.post("/quotas", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const parsed = CreateQuotaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [quota] = await db.insert(quotaCategoriesTable).values(parsed.data).returning();
  res.status(201).json(fmt(quota));
});

router.patch("/quotas/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = CreateQuotaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [quota] = await db.update(quotaCategoriesTable).set(parsed.data).where(eq(quotaCategoriesTable.id, id)).returning();
  if (!quota) {
    res.status(404).json({ error: "Quota not found" });
    return;
  }
  res.json(fmt(quota));
});

router.delete("/quotas/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(quotaCategoriesTable).where(eq(quotaCategoriesTable.id, id));
  res.sendStatus(204);
});

export default router;

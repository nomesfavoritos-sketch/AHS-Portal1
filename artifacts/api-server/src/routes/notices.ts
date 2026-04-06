import { Router, type IRouter } from "express";
import { db, noticesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateNoticeBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (n: typeof noticesTable.$inferSelect) => ({
  id: n.id,
  title: n.title,
  content: n.content,
  category: n.category,
  isActive: n.isActive,
  publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
  expiresAt: n.expiresAt ? n.expiresAt.toISOString() : null,
  createdBy: n.createdBy,
  createdAt: n.createdAt.toISOString(),
});

router.get("/notices", async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.active === "true") conditions.push(eq(noticesTable.isActive, true));
  const where = conditions.length ? and(...conditions) : undefined;
  const notices = await db.select().from(noticesTable).where(where).orderBy(noticesTable.createdAt);
  res.json(notices.map(fmt));
});

router.post("/notices", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const createdBy = sess.userId as number;
  const parsed = CreateNoticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [notice] = await db.insert(noticesTable).values({
    ...parsed.data,
    createdBy,
    publishedAt: parsed.data.isActive ? new Date() : undefined,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
  }).returning();
  res.status(201).json(fmt(notice));
});

router.patch("/notices/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = CreateNoticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [notice] = await db.update(noticesTable).set({
    ...parsed.data,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
  }).where(eq(noticesTable.id, id)).returning();
  if (!notice) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }
  res.json(fmt(notice));
});

router.delete("/notices/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(noticesTable).where(eq(noticesTable.id, id));
  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { db, admissionSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSessionBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (s: typeof admissionSessionsTable.$inferSelect) => ({
  id: s.id,
  name: s.name,
  year: s.year,
  startDate: s.startDate,
  endDate: s.endDate,
  isActive: s.isActive,
  status: s.status,
  createdAt: s.createdAt.toISOString(),
});

router.get("/sessions", async (_req, res): Promise<void> => {
  const sessions = await db.select().from(admissionSessionsTable).orderBy(admissionSessionsTable.year);
  res.json(sessions.map(fmt));
});

router.post("/sessions", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db.insert(admissionSessionsTable).values(parsed.data).returning();
  res.status(201).json(fmt(session));
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [session] = await db.select().from(admissionSessionsTable).where(eq(admissionSessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(fmt(session));
});

router.patch("/sessions/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db.update(admissionSessionsTable).set(parsed.data).where(eq(admissionSessionsTable.id, id)).returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(fmt(session));
});

export default router;

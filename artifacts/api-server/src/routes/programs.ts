import { Router, type IRouter } from "express";
import { db, programsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateProgramBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (p: typeof programsTable.$inferSelect) => ({
  id: p.id,
  name: p.name,
  code: p.code,
  duration: p.duration,
  seats: p.seats,
  description: p.description ?? null,
  isActive: p.isActive,
  createdAt: p.createdAt.toISOString(),
});

router.get("/programs", async (_req, res): Promise<void> => {
  const programs = await db.select().from(programsTable).orderBy(programsTable.name);
  res.json(programs.map(fmt));
});

router.post("/programs", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const parsed = CreateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [program] = await db.insert(programsTable).values(parsed.data).returning();
  res.status(201).json(fmt(program));
});

router.get("/programs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [program] = await db.select().from(programsTable).where(eq(programsTable.id, id));
  if (!program) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json(fmt(program));
});

router.patch("/programs/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = CreateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [program] = await db.update(programsTable).set(parsed.data).where(eq(programsTable.id, id)).returning();
  if (!program) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json(fmt(program));
});

router.delete("/programs/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(programsTable).where(eq(programsTable.id, id));
  res.sendStatus(204);
});

export default router;

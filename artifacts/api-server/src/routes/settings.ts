import { Router, type IRouter } from "express";
import { db, systemSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (s: typeof systemSettingsTable.$inferSelect) => ({
  id: s.id,
  key: s.key,
  value: s.value,
  description: s.description ?? null,
  updatedAt: s.updatedAt.toISOString(),
});

router.get("/settings", requireAuth, requireAdminRole, async (_req, res): Promise<void> => {
  const settings = await db.select().from(systemSettingsTable).orderBy(systemSettingsTable.key);
  res.json(settings.map(fmt));
});

router.patch("/settings/:key", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
  const { value } = req.body as { value: string };
  if (!value && value !== "false" && value !== "0") {
    res.status(400).json({ error: "value is required" });
    return;
  }
  const [existing] = await db.select().from(systemSettingsTable).where(eq(systemSettingsTable.key, key));
  let setting;
  if (existing) {
    [setting] = await db
      .update(systemSettingsTable)
      .set({ value, updatedBy: (req.session as any).userId, updatedAt: new Date() })
      .where(eq(systemSettingsTable.key, key))
      .returning();
  } else {
    [setting] = await db
      .insert(systemSettingsTable)
      .values({ key, value, updatedBy: (req.session as any).userId })
      .returning();
  }
  res.json(fmt(setting));
});

export default router;

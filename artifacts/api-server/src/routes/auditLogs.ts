import { Router, type IRouter } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/audit-logs", requireAuth, requireRoles("super_admin"), async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (req.query.userId) conditions.push(eq(auditLogsTable.userId, Number(req.query.userId)));
  if (req.query.action) conditions.push(eq(auditLogsTable.action, req.query.action as string));
  const where = conditions.length ? and(...conditions) : undefined;

  const [logs, totalResult] = await Promise.all([
    db.select().from(auditLogsTable).where(where).limit(limit).offset(offset).orderBy(auditLogsTable.createdAt),
    db.select({ count: count() }).from(auditLogsTable).where(where),
  ]);

  res.json({
    logs: logs.map(l => ({
      id: l.id,
      userId: l.userId ?? null,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId ?? null,
      details: l.details ?? null,
      ipAddress: l.ipAddress ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    total: Number(totalResult[0]?.count ?? 0),
    page,
    limit,
  });
});

export default router;

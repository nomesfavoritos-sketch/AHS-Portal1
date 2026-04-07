import { Router, type IRouter } from "express";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, requireRoles } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/audit-logs", requireAuth, requireRoles("super_admin"), async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (req.query.userId) conditions.push(eq(auditLogsTable.userId, Number(req.query.userId)));
  if (req.query.action) conditions.push(eq(auditLogsTable.action, req.query.action as string));
  if (req.query.entityType) conditions.push(eq(auditLogsTable.entityType, req.query.entityType as string));
  if (req.query.dateFrom) conditions.push(gte(auditLogsTable.createdAt, new Date(req.query.dateFrom as string)));
  if (req.query.dateTo) {
    const to = new Date(req.query.dateTo as string);
    to.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogsTable.createdAt, to));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [logsWithUsers, totalResult] = await Promise.all([
    db.select({
      id: auditLogsTable.id,
      userId: auditLogsTable.userId,
      action: auditLogsTable.action,
      entityType: auditLogsTable.entityType,
      entityId: auditLogsTable.entityId,
      details: auditLogsTable.details,
      ipAddress: auditLogsTable.ipAddress,
      createdAt: auditLogsTable.createdAt,
      userFullName: usersTable.fullName,
      userEmail: usersTable.email,
    })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(where)
      .orderBy(sql`${auditLogsTable.createdAt} DESC`)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogsTable).where(where),
  ]);

  res.json({
    logs: logsWithUsers.map(l => ({
      id: l.id,
      userId: l.userId ?? null,
      userFullName: l.userFullName ?? null,
      userEmail: l.userEmail ?? null,
      action: l.action,
      entityType: l.entityType ?? null,
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

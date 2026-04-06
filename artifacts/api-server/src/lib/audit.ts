import { db, auditLogsTable } from "@workspace/db";

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: {
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      userId: userId ?? undefined,
      action,
      entityType,
      entityId: entityId ?? undefined,
      details: details ?? undefined,
      ipAddress: ipAddress ?? undefined,
    });
  } catch {
    // Audit logging should never break the main flow
  }
}

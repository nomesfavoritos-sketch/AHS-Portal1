import { Router, type IRouter } from "express";
import { db, joinedStudentsTable, usersTable, programsTable, applicationsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { MarkStudentJoinedBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/joined-students", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const conditions = [isNull(joinedStudentsTable.removedAt)];
  if (req.query.programId) conditions.push(eq(joinedStudentsTable.programId, Number(req.query.programId)));
  if (req.query.sessionId) conditions.push(eq(joinedStudentsTable.sessionId, Number(req.query.sessionId)));
  if (req.query.includeRemoved === "true") conditions.splice(0, 1);
  const where = and(...conditions);
  const students = await db.select().from(joinedStudentsTable).where(where).orderBy(joinedStudentsTable.joinedAt);

  const formatted = await Promise.all(students.map(async (s) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId));
    const [program] = await db.select().from(programsTable).where(eq(programsTable.id, s.programId));
    return {
      id: s.id,
      applicationId: s.applicationId,
      userId: s.userId,
      sessionId: s.sessionId,
      programId: s.programId,
      rollNumber: s.rollNumber ?? null,
      verifierName: s.verifierName ?? null,
      joinedAt: s.joinedAt.toISOString(),
      removedAt: s.removedAt?.toISOString() ?? null,
      removalReason: s.removalReason ?? null,
      createdAt: s.createdAt.toISOString(),
      user: user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone ?? null, isActive: user.isActive, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() } : null,
      program: program ? { id: program.id, name: program.name, code: program.code, duration: program.duration, seats: program.seats, description: program.description ?? null, isActive: program.isActive, createdAt: program.createdAt.toISOString() } : null,
    };
  }));

  res.json(formatted);
});

router.post("/joined-students", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const parsed = MarkStudentJoinedBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, parsed.data.applicationId));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const [joined] = await db.insert(joinedStudentsTable).values({
    applicationId: app.id,
    userId: app.userId,
    sessionId: app.sessionId,
    programId: app.programId,
    rollNumber: parsed.data.rollNumber ?? undefined,
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, joined.userId));
  const [program] = await db.select().from(programsTable).where(eq(programsTable.id, joined.programId));

  res.status(201).json({
    id: joined.id,
    applicationId: joined.applicationId,
    userId: joined.userId,
    sessionId: joined.sessionId,
    programId: joined.programId,
    rollNumber: joined.rollNumber ?? null,
    joinedAt: joined.joinedAt.toISOString(),
    createdAt: joined.createdAt.toISOString(),
    user: user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone ?? null, isActive: user.isActive, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() } : null,
    program: program ? { id: program.id, name: program.name, code: program.code, duration: program.duration, seats: program.seats, description: program.description ?? null, isActive: program.isActive, createdAt: program.createdAt.toISOString() } : null,
  });
});

router.delete("/joined-students/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const removedById = sess.userId as number;
  const id = Number(req.params.id);
  const { reason } = req.body;

  if (!reason || String(reason).trim().length < 10) {
    res.status(400).json({ error: "A removal reason of at least 10 characters is required" });
    return;
  }

  const [student] = await db.select().from(joinedStudentsTable).where(eq(joinedStudentsTable.id, id));
  if (!student) { res.status(404).json({ error: "Joined student record not found" }); return; }
  if (student.removedAt) { res.status(400).json({ error: "Student already removed" }); return; }

  const [updated] = await db.update(joinedStudentsTable).set({
    removedAt: new Date(),
    removedById,
    removalReason: String(reason).trim(),
  }).where(eq(joinedStudentsTable.id, id)).returning();

  await db.update(applicationsTable).set({ status: "rejected" }).where(eq(applicationsTable.id, student.applicationId));
  await logAudit({ userId: removedById, action: "joined_student_removed", entityType: "joined_student", entityId: id });

  res.json({ success: true, removedAt: updated.removedAt?.toISOString() });
});

export default router;

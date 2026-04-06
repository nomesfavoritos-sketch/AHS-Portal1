import { Router, type IRouter } from "express";
import { db, joinedStudentsTable, usersTable, programsTable, applicationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { MarkStudentJoinedBody } from "@workspace/api-zod";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/joined-students", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.programId) conditions.push(eq(joinedStudentsTable.programId, Number(req.query.programId)));
  if (req.query.sessionId) conditions.push(eq(joinedStudentsTable.sessionId, Number(req.query.sessionId)));
  const where = conditions.length ? and(...conditions) : undefined;
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
      joinedAt: s.joinedAt.toISOString(),
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

export default router;

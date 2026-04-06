import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, studentProfilesTable } from "@workspace/db";
import { eq, ilike, and, count, sql } from "drizzle-orm";
import { CreateUserBody, UpdateUserBody } from "@workspace/api-zod";
import { requireAuth, requireRoles } from "../middlewares/auth";

const router: IRouter = Router();

const formatUser = (user: typeof usersTable.$inferSelect) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  phone: user.phone ?? null,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

router.get("/users", requireAuth, requireRoles("super_admin", "admission_admin"), async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const role = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;

  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role));
  if (search) conditions.push(ilike(usersTable.fullName, `%${search}%`));

  const where = conditions.length ? and(...conditions) : undefined;

  const [users, totalResult] = await Promise.all([
    db.select().from(usersTable).where(where).limit(limit).offset(offset).orderBy(usersTable.createdAt),
    db.select({ count: count() }).from(usersTable).where(where),
  ]);

  res.json({
    users: users.map(formatUser),
    total: Number(totalResult[0]?.count ?? 0),
    page,
    limit,
  });
});

router.post("/users", requireAuth, requireRoles("super_admin"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, fullName, role, phone } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    role,
    phone: phone ?? undefined,
  }).returning();

  if (role === "student") {
    await db.insert(studentProfilesTable).values({ userId: user.id });
  }

  res.status(201).json(formatUser(user));
});

router.get("/users/:id", requireAuth, requireRoles("super_admin", "admission_admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, requireRoles("super_admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.fullName != null) updateData.fullName = parsed.data.fullName;
  if (parsed.data.role != null) updateData.role = parsed.data.role;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone ?? undefined;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.delete("/users/:id", requireAuth, requireRoles("super_admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

// Student profile
router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const [profile] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, userId));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json({
    id: profile.id,
    userId: profile.userId,
    fatherName: profile.fatherName ?? null,
    dateOfBirth: profile.dateOfBirth ?? null,
    gender: profile.gender ?? null,
    cnic: profile.cnic ?? null,
    address: profile.address ?? null,
    city: profile.city ?? null,
    domicile: profile.domicile ?? null,
    religion: profile.religion ?? null,
    nationality: profile.nationality ?? null,
    matricMarks: profile.matricMarks ?? null,
    matricTotal: profile.matricTotal ?? null,
    interMarks: profile.interMarks ?? null,
    interTotal: profile.interTotal ?? null,
    interYear: profile.interYear ?? null,
    interBoard: profile.interBoard ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;

  const [existing] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, userId));
  
  const updateData: Partial<typeof studentProfilesTable.$inferInsert> = {};
  const b = req.body;
  if (b.fatherName !== undefined) updateData.fatherName = b.fatherName;
  if (b.dateOfBirth !== undefined) updateData.dateOfBirth = b.dateOfBirth;
  if (b.gender !== undefined) updateData.gender = b.gender;
  if (b.cnic !== undefined) updateData.cnic = b.cnic;
  if (b.address !== undefined) updateData.address = b.address;
  if (b.city !== undefined) updateData.city = b.city;
  if (b.domicile !== undefined) updateData.domicile = b.domicile;
  if (b.religion !== undefined) updateData.religion = b.religion;
  if (b.nationality !== undefined) updateData.nationality = b.nationality;
  if (b.matricMarks !== undefined) updateData.matricMarks = b.matricMarks;
  if (b.matricTotal !== undefined) updateData.matricTotal = b.matricTotal;
  if (b.interMarks !== undefined) updateData.interMarks = b.interMarks;
  if (b.interTotal !== undefined) updateData.interTotal = b.interTotal;
  if (b.interYear !== undefined) updateData.interYear = b.interYear;
  if (b.interBoard !== undefined) updateData.interBoard = b.interBoard;

  let profile;
  if (existing) {
    [profile] = await db.update(studentProfilesTable).set(updateData).where(eq(studentProfilesTable.userId, userId)).returning();
  } else {
    [profile] = await db.insert(studentProfilesTable).values({ userId, ...updateData }).returning();
  }

  res.json({
    id: profile.id,
    userId: profile.userId,
    fatherName: profile.fatherName ?? null,
    dateOfBirth: profile.dateOfBirth ?? null,
    gender: profile.gender ?? null,
    cnic: profile.cnic ?? null,
    address: profile.address ?? null,
    city: profile.city ?? null,
    domicile: profile.domicile ?? null,
    religion: profile.religion ?? null,
    nationality: profile.nationality ?? null,
    matricMarks: profile.matricMarks ?? null,
    matricTotal: profile.matricTotal ?? null,
    interMarks: profile.interMarks ?? null,
    interTotal: profile.interTotal ?? null,
    interYear: profile.interYear ?? null,
    interBoard: profile.interBoard ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

export default router;

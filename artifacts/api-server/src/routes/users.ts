import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, studentProfilesTable } from "@workspace/db";
import { eq, ilike, and, count } from "drizzle-orm";
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

function calcCompletion(p: typeof studentProfilesTable.$inferSelect): number {
  const personalFields = [
    p.fatherName, p.dateOfBirth, p.gender, p.cnic, p.religion,
    p.domicileDistrict, p.province, p.permanentAddress, p.contactNumber, p.guardianContactNumber,
  ];
  const academicFields = [
    p.matricBoard, p.matricYear, p.matricRoll, p.matricTotal, p.matricMarks,
    p.interBoard, p.interYear, p.interRoll, p.interTotal, p.interMarks,
  ];
  const allFields = [...personalFields, ...academicFields];
  const filled = allFields.filter((f) => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / allFields.length) * 100);
}

function formatProfile(profile: typeof studentProfilesTable.$inferSelect) {
  const completion = calcCompletion(profile);
  return {
    id: profile.id,
    userId: profile.userId,
    fatherName: profile.fatherName ?? null,
    dateOfBirth: profile.dateOfBirth ?? null,
    gender: profile.gender ?? null,
    cnic: profile.cnic ?? null,
    religion: profile.religion ?? null,
    nationality: profile.nationality ?? null,
    domicileDistrict: profile.domicileDistrict ?? null,
    province: profile.province ?? null,
    permanentAddress: profile.permanentAddress ?? null,
    presentAddress: profile.presentAddress ?? null,
    contactNumber: profile.contactNumber ?? null,
    guardianContactNumber: profile.guardianContactNumber ?? null,
    photoPath: profile.photoPath ?? null,
    address: profile.address ?? null,
    city: profile.city ?? null,
    domicile: profile.domicile ?? null,
    quotaType: profile.quotaType ?? "open_merit",
    minorityDetails: profile.minorityDetails ?? null,
    disabilityDetails: profile.disabilityDetails ?? null,
    matricBoard: profile.matricBoard ?? null,
    matricYear: profile.matricYear ?? null,
    matricRoll: profile.matricRoll ?? null,
    matricTotal: profile.matricTotal ?? null,
    matricMarks: profile.matricMarks ?? null,
    interBoard: profile.interBoard ?? null,
    interYear: profile.interYear ?? null,
    interRoll: profile.interRoll ?? null,
    interTotal: profile.interTotal ?? null,
    interMarks: profile.interMarks ?? null,
    isComplete: completion >= 80,
    completionPercentage: completion,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

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
    const [created] = await db.insert(studentProfilesTable).values({ userId }).returning();
    res.json(formatProfile(created));
    return;
  }
  res.json(formatProfile(profile));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;

  const [existing] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, userId));

  const updateData: Partial<typeof studentProfilesTable.$inferInsert> = {};
  const b = req.body;
  const profileFields = [
    "fatherName", "dateOfBirth", "gender", "cnic", "religion", "nationality",
    "domicileDistrict", "province", "permanentAddress", "presentAddress",
    "contactNumber", "guardianContactNumber", "photoPath",
    "address", "city", "domicile",
    "quotaType", "minorityDetails", "disabilityDetails",
    "matricBoard", "matricYear", "matricRoll", "matricTotal", "matricMarks",
    "interBoard", "interYear", "interRoll", "interTotal", "interMarks",
  ] as const;

  for (const field of profileFields) {
    if (b[field] !== undefined) {
      (updateData as Record<string, unknown>)[field] = b[field];
    }
  }

  let profile: typeof studentProfilesTable.$inferSelect;
  if (existing) {
    [profile] = await db.update(studentProfilesTable).set(updateData).where(eq(studentProfilesTable.userId, userId)).returning();
  } else {
    [profile] = await db.insert(studentProfilesTable).values({ userId, ...updateData }).returning();
  }

  const completion = calcCompletion(profile);
  if (profile.completionPercentage !== completion || profile.isComplete !== (completion >= 80)) {
    [profile] = await db.update(studentProfilesTable).set({
      completionPercentage: completion,
      isComplete: completion >= 80,
    }).where(eq(studentProfilesTable.userId, userId)).returning();
  }

  res.json(formatProfile(profile));
});

export default router;

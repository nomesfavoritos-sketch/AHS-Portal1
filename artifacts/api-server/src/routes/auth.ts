import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, studentProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody, ForgotPasswordBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();


router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { identifier, password } = parsed.data;

  let user: typeof usersTable.$inferSelect | undefined;
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    // Email-based login (admins)
    [user] = await db.select().from(usersTable).where(eq(usersTable.email, trimmed.toLowerCase()));
  } else {
    // CNIC/B-Form login (students) — normalize by stripping dashes
    const cnic = trimmed.replace(/-/g, "");
    [user] = await db.select().from(usersTable).where(eq(usersTable.cnic, cnic));
  }

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid CNIC/B-Form or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const sess = req.session as Record<string, unknown>;
  sess.userId = user.id;
  sess.userRole = user.role;

  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve()))
  );

  await logAudit({
    userId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
    ipAddress: req.ip,
  });

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { cnic: rawCnic, email, password, fullName, phone } = parsed.data;
  const cnic = rawCnic.replace(/-/g, "");

  if (!/^\d{13}$/.test(cnic)) {
    res.status(400).json({ error: "CNIC/B-Form must be exactly 13 digits" });
    return;
  }

  const [existingCnic] = await db.select().from(usersTable).where(eq(usersTable.cnic, cnic));
  if (existingCnic) {
    res.status(409).json({ error: "An account with this CNIC/B-Form already exists" });
    return;
  }

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existingEmail) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    cnic,
    passwordHash,
    fullName,
    phone: phone ?? undefined,
    role: "student",
  }).returning();

  // Create empty student profile
  await db.insert(studentProfilesTable).values({ userId: user.id });

  const sess = req.session as Record<string, unknown>;
  sess.userId = user.id;
  sess.userRole = user.role;

  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve()))
  );

  await logAudit({
    userId: user.id,
    action: "register",
    entityType: "user",
    entityId: user.id,
    ipAddress: req.ip,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  await logAudit({
    userId,
    action: "logout",
    entityType: "user",
    entityId: userId,
    ipAddress: req.ip,
  });
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Scaffold: In production, send reset email
  res.json({ message: "If this email exists, a reset link has been sent." });
});

export default router;

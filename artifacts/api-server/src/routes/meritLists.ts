import { Router, type IRouter } from "express";
import {
  db,
  meritListsTable,
  meritListEntriesTable,
  applicationsTable,
  usersTable,
  programsTable,
  admissionSessionsTable,
  studentProfilesTable,
  quotaCategoriesTable,
  systemSettingsTable,
  paymentChallansTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdminRole } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

/* ── helpers ─────────────────────────────────────────────────────────────── */

function maskCnic(cnic: string | null | undefined): string {
  if (!cnic) return "XXXXX-XXXXXXX-X";
  return cnic.replace(/^(\d{5})-(\d{7})-(\d)$/, "$1-XXXXXXX-$3");
}

async function getMeritSettings() {
  const settings = await db.select().from(systemSettingsTable);
  const get = (key: string, def: string) => settings.find((s) => s.key === key)?.value ?? def;
  return {
    matricWeight: parseFloat(get("merit_matric_weight", "10")),
    fscWeight: parseFloat(get("merit_fsc_weight", "70")),
    tieBreaker: get("merit_tie_breaker", "fsc_marks"),
    requirePaymentVerified: get("merit_require_payment_verified", "false") === "true",
    requireDocumentsComplete: get("merit_require_documents_complete", "false") === "true",
  };
}

function calcMerit(
  profile: typeof studentProfilesTable.$inferSelect | null,
  matricWeight: number,
  fscWeight: number,
) {
  const totalWeight = matricWeight + fscWeight;
  const matricMarks = profile?.matricMarks ?? 0;
  const matricTotal = profile?.matricTotal || 1100;
  const fscMarks = profile?.interMarks ?? 0;
  const fscTotal = profile?.interTotal || 1100;

  const matricWeightedScore = (matricMarks / matricTotal) * matricWeight;
  const fscWeightedScore = (fscMarks / fscTotal) * fscWeight;
  const rawScore = matricWeightedScore + fscWeightedScore;
  const normalizedScore = totalWeight > 0 ? (rawScore / totalWeight) * 100 : 0;

  return { matricMarks, matricTotal, matricWeight, matricWeightedScore, fscMarks, fscTotal, fscWeight, fscWeightedScore, rawScore, normalizedScore, matricScore: matricWeightedScore, fscScore: fscWeightedScore };
}

const fmtList = (m: typeof meritListsTable.$inferSelect) => ({
  id: m.id,
  name: m.name,
  sessionId: m.sessionId,
  programId: m.programId,
  quotaId: m.quotaId ?? null,
  listNumber: m.listNumber,
  versionNumber: m.versionNumber,
  publishedAt: m.publishedAt ? m.publishedAt.toISOString() : null,
  frozenAt: m.frozenAt ? m.frozenAt.toISOString() : null,
  isPublished: m.isPublished,
  isFrozen: m.isFrozen,
  totalEntries: m.totalEntries,
  generatedBy: m.generatedBy ?? null,
  publishedBy: m.publishedBy ?? null,
  createdAt: m.createdAt.toISOString(),
});

async function buildEntry(e: typeof meritListEntriesTable.$inferSelect) {
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, e.applicationId));
  const [user] = app ? await db.select().from(usersTable).where(eq(usersTable.id, app.userId)) : [undefined];
  const [program] = app ? await db.select().from(programsTable).where(eq(programsTable.id, app.programId)) : [undefined];
  const [session] = app ? await db.select().from(admissionSessionsTable).where(eq(admissionSessionsTable.id, app.sessionId)) : [undefined];
  const [profile] = user ? await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, user.id)) : [undefined];
  return {
    id: e.id,
    meritListId: e.meritListId,
    applicationId: e.applicationId,
    quotaId: e.quotaId ?? null,
    rank: e.rank,
    meritScore: e.meritScore,
    meritScoreRaw: e.meritScoreRaw ?? null,
    meritScoreNormalized: e.meritScoreNormalized ?? null,
    matricScore: e.matricScore ?? null,
    fscScore: e.fscScore ?? null,
    meritBreakdown: e.meritBreakdown ?? {},
    status: e.status,
    cnicMasked: maskCnic(profile?.cnic),
    application: app ? {
      id: app.id,
      applicationNumber: app.applicationNumber,
      userId: app.userId,
      sessionId: app.sessionId,
      programId: app.programId,
      quotaId: app.quotaId ?? null,
      status: app.status,
      remarks: app.remarks ?? null,
      submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
      meritScore: app.meritScore ?? null,
      meritScoreRaw: app.meritScoreRaw ?? null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      user: user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone ?? null, isActive: user.isActive, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() } : null,
      program: program ? { id: program.id, name: program.name, code: program.code, duration: program.duration, seats: program.seats, description: program.description ?? null, isActive: program.isActive, createdAt: program.createdAt.toISOString() } : null,
      session: session ? { id: session.id, name: session.name, year: session.year, startDate: session.startDate, endDate: session.endDate, isActive: session.isActive, status: session.status, createdAt: session.createdAt.toISOString() } : null,
    } : null,
  };
}

/* ── routes ──────────────────────────────────────────────────────────────── */

router.get("/merit-lists", async (req, res): Promise<void> => {
  const conditions: ReturnType<typeof eq>[] = [];
  if (req.query.sessionId) conditions.push(eq(meritListsTable.sessionId, Number(req.query.sessionId)));
  if (req.query.programId) conditions.push(eq(meritListsTable.programId, Number(req.query.programId)));
  const isAdmin = (req.session as any)?.userId && ["admin", "super_admin", "data_entry"].includes((req.session as any)?.userRole);
  if (!isAdmin) conditions.push(eq(meritListsTable.isPublished, true));
  const where = conditions.length ? and(...conditions) : undefined;
  const lists = await db.select().from(meritListsTable).where(where).orderBy(meritListsTable.createdAt);
  res.json(lists.map(fmtList));
});

router.post("/merit-lists", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const { name, sessionId, programId, quotaId, listNumber, eligibilityFilters } = req.body as {
    name: string; sessionId: number; programId: number;
    quotaId?: number; listNumber?: number;
    eligibilityFilters?: { requirePaymentVerified?: boolean; requireDocumentsComplete?: boolean; statuses?: string[] };
  };

  if (!name || !sessionId || !programId) {
    res.status(400).json({ error: "name, sessionId and programId are required" });
    return;
  }

  const cfg = await getMeritSettings();
  const filters = eligibilityFilters ?? {};
  const requirePV = filters.requirePaymentVerified ?? cfg.requirePaymentVerified;
  const allowedStatuses = filters.statuses ?? ["submitted", "verified", "approved"];

  const appConditions: ReturnType<typeof eq>[] = [
    eq(applicationsTable.sessionId, sessionId),
    eq(applicationsTable.programId, programId),
    inArray(applicationsTable.status, allowedStatuses),
  ];
  if (quotaId) appConditions.push(eq(applicationsTable.quotaId, quotaId));

  const apps = await db
    .select({ app: applicationsTable, profile: studentProfilesTable })
    .from(applicationsTable)
    .leftJoin(studentProfilesTable, eq(applicationsTable.userId, studentProfilesTable.userId))
    .where(and(...appConditions));

  let filteredApps = apps;
  if (requirePV) {
    const challans = await db.select().from(paymentChallansTable).where(eq(paymentChallansTable.status, "paid"));
    const paidAppIds = new Set(challans.map((c) => c.applicationId));
    filteredApps = apps.filter(({ app }) => paidAppIds.has(app.id));
  }

  const scored = filteredApps.map(({ app, profile }) => {
    const breakdown = calcMerit(profile, cfg.matricWeight, cfg.fscWeight);
    return { appId: app.id, quotaId: app.quotaId ?? quotaId ?? null, breakdown };
  });

  scored.sort((a, b) => {
    const diff = b.breakdown.normalizedScore - a.breakdown.normalizedScore;
    if (Math.abs(diff) > 0.0001) return diff;
    if (cfg.tieBreaker === "fsc_marks") return b.breakdown.fscMarks - a.breakdown.fscMarks;
    if (cfg.tieBreaker === "matric_marks") return b.breakdown.matricMarks - a.breakdown.matricMarks;
    return 0;
  });

  const userId = (req.session as any).userId;
  const existingLists = await db.select().from(meritListsTable).where(and(eq(meritListsTable.sessionId, sessionId), eq(meritListsTable.programId, programId)));
  const maxVersion = existingLists.reduce((max, l) => Math.max(max, l.versionNumber), 0);

  const [meritList] = await db.insert(meritListsTable).values({
    name, sessionId, programId,
    quotaId: quotaId ?? null,
    listNumber: listNumber ?? 1,
    versionNumber: maxVersion + 1,
    totalEntries: scored.length,
    generatedBy: userId,
    eligibilityFilters: filters,
  }).returning();

  if (scored.length > 0) {
    await db.insert(meritListEntriesTable).values(
      scored.map(({ appId, quotaId: qId, breakdown }, idx) => ({
        meritListId: meritList.id,
        applicationId: appId,
        quotaId: qId ?? null,
        rank: idx + 1,
        meritScore: breakdown.normalizedScore,
        meritScoreRaw: breakdown.rawScore,
        meritScoreNormalized: breakdown.normalizedScore,
        matricScore: breakdown.matricScore,
        fscScore: breakdown.fscScore,
        meritBreakdown: { matricMarks: breakdown.matricMarks, matricTotal: breakdown.matricTotal, matricWeight: breakdown.matricWeight, matricWeightedScore: breakdown.matricWeightedScore, fscMarks: breakdown.fscMarks, fscTotal: breakdown.fscTotal, fscWeight: breakdown.fscWeight, fscWeightedScore: breakdown.fscWeightedScore, rawScore: breakdown.rawScore, normalizedScore: breakdown.normalizedScore },
        status: "selected",
      }))
    );
    for (const { appId, breakdown } of scored) {
      await db.update(applicationsTable).set({ meritScore: breakdown.normalizedScore, meritScoreRaw: breakdown.rawScore, meritBreakdown: { rawScore: breakdown.rawScore, normalizedScore: breakdown.normalizedScore } }).where(eq(applicationsTable.id, appId));
    }
  }

  await logAudit(db, userId, "merit_list_generated", "merit_list", meritList.id, { name, sessionId, programId, count: scored.length });
  res.status(201).json(fmtList(meritList));
});

router.get("/merit-lists/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [meritList] = await db.select().from(meritListsTable).where(eq(meritListsTable.id, id));
  if (!meritList) { res.status(404).json({ error: "Merit list not found" }); return; }
  const isAdmin = (req.session as any)?.userId && ["admin", "super_admin", "data_entry"].includes((req.session as any)?.userRole);
  if (!meritList.isPublished && !isAdmin) { res.status(403).json({ error: "Merit list not published" }); return; }
  const entries = await db.select().from(meritListEntriesTable).where(eq(meritListEntriesTable.meritListId, id)).orderBy(meritListEntriesTable.rank);
  const entriesFormatted = await Promise.all(entries.map(buildEntry));
  res.json({ ...fmtList(meritList), entries: entriesFormatted });
});

router.patch("/merit-lists/:id/publish", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [meritList] = await db.select().from(meritListsTable).where(eq(meritListsTable.id, id));
  if (!meritList) { res.status(404).json({ error: "Not found" }); return; }
  if (meritList.isFrozen) { res.status(400).json({ error: "Cannot publish a frozen list" }); return; }
  const userId = (req.session as any).userId;
  const [updated] = await db.update(meritListsTable).set({ isPublished: true, publishedAt: new Date(), publishedBy: userId }).where(eq(meritListsTable.id, id)).returning();
  await logAudit(db, userId, "merit_list_published", "merit_list", id, {});
  res.json(fmtList(updated));
});

router.patch("/merit-lists/:id/freeze", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [meritList] = await db.select().from(meritListsTable).where(eq(meritListsTable.id, id));
  if (!meritList) { res.status(404).json({ error: "Not found" }); return; }
  const userId = (req.session as any).userId;
  const [updated] = await db.update(meritListsTable).set({ isFrozen: true, frozenAt: new Date() }).where(eq(meritListsTable.id, id)).returning();
  await logAudit(db, userId, "merit_list_frozen", "merit_list", id, {});
  res.json(fmtList(updated));
});

router.post("/merit-lists/:id/recalculate", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [meritList] = await db.select().from(meritListsTable).where(eq(meritListsTable.id, id));
  if (!meritList) { res.status(404).json({ error: "Not found" }); return; }
  if (meritList.isFrozen) { res.status(400).json({ error: "Cannot recalculate a frozen list" }); return; }
  const cfg = await getMeritSettings();
  const entries = await db.select().from(meritListEntriesTable).where(eq(meritListEntriesTable.meritListId, id));
  const scored: { entryId: number; breakdown: ReturnType<typeof calcMerit> }[] = [];
  for (const entry of entries) {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, entry.applicationId));
    const [profile] = app ? await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, app.userId)) : [undefined];
    scored.push({ entryId: entry.id, breakdown: calcMerit(profile ?? null, cfg.matricWeight, cfg.fscWeight) });
  }
  scored.sort((a, b) => b.breakdown.normalizedScore - a.breakdown.normalizedScore);
  for (let i = 0; i < scored.length; i++) {
    const { entryId, breakdown } = scored[i];
    await db.update(meritListEntriesTable).set({ rank: i + 1, meritScore: breakdown.normalizedScore, meritScoreRaw: breakdown.rawScore, meritScoreNormalized: breakdown.normalizedScore, matricScore: breakdown.matricScore, fscScore: breakdown.fscScore, meritBreakdown: { matricMarks: breakdown.matricMarks, matricTotal: breakdown.matricTotal, matricWeight: breakdown.matricWeight, matricWeightedScore: breakdown.matricWeightedScore, fscMarks: breakdown.fscMarks, fscTotal: breakdown.fscTotal, fscWeight: breakdown.fscWeight, fscWeightedScore: breakdown.fscWeightedScore, rawScore: breakdown.rawScore, normalizedScore: breakdown.normalizedScore } }).where(eq(meritListEntriesTable.id, entryId));
  }
  await db.update(meritListsTable).set({ versionNumber: meritList.versionNumber + 1 }).where(eq(meritListsTable.id, id));
  const userId = (req.session as any).userId;
  await logAudit(db, userId, "merit_list_recalculated", "merit_list", id, {});
  res.json({ message: "Recalculated", count: scored.length });
});

router.get("/merit-search", async (req, res): Promise<void> => {
  const query = (req.query.query as string | undefined)?.trim();
  if (!query || query.length < 4) { res.status(400).json({ error: "Query must be at least 4 characters" }); return; }

  const appsByNumber = await db.select().from(applicationsTable).where(eq(applicationsTable.applicationNumber, query.toUpperCase()));
  const profilesByCnic = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.cnic, query));

  const appIds = new Set(appsByNumber.map((a) => a.id));
  if (profilesByCnic.length > 0) {
    const userIds = profilesByCnic.map((p) => p.userId);
    const appsByUser = await db.select().from(applicationsTable).where(inArray(applicationsTable.userId, userIds));
    for (const app of appsByUser) appIds.add(app.id);
  }

  if (appIds.size === 0) { res.json([]); return; }

  const results: unknown[] = [];
  for (const appId of appIds) {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, appId));
    if (!app) continue;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));
    const [program] = await db.select().from(programsTable).where(eq(programsTable.id, app.programId));
    const [session] = await db.select().from(admissionSessionsTable).where(eq(admissionSessionsTable.id, app.sessionId));
    const [profile] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, app.userId));
    const meritEntries = await db.select({ entry: meritListEntriesTable, list: meritListsTable }).from(meritListEntriesTable).innerJoin(meritListsTable, eq(meritListEntriesTable.meritListId, meritListsTable.id)).where(and(eq(meritListEntriesTable.applicationId, appId), eq(meritListsTable.isPublished, true)));
    let quota = null;
    if (app.quotaId) { const [q] = await db.select().from(quotaCategoriesTable).where(eq(quotaCategoriesTable.id, app.quotaId)); quota = q ?? null; }
    const bestEntry = meritEntries.length > 0 ? meritEntries.sort((a, b) => a.entry.rank - b.entry.rank)[0] : null;
    results.push({ applicationNumber: app.applicationNumber, studentName: user?.fullName ?? "Unknown", cnicMasked: maskCnic(profile?.cnic), programName: program?.name ?? "Unknown", sessionName: session?.name ?? "Unknown", meritScore: bestEntry?.entry.meritScore ?? app.meritScore ?? null, meritScoreNormalized: bestEntry?.entry.meritScoreNormalized ?? null, rank: bestEntry?.entry.rank ?? null, quotaName: quota?.name ?? null, listNumber: bestEntry?.list.listNumber ?? null, meritListName: bestEntry?.list.name ?? null, status: app.status, isSelected: bestEntry?.entry.status === "selected" });
  }
  res.json(results);
});

export default router;

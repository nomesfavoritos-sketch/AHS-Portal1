import { Router, type IRouter } from "express";
import { db, programSeatMatrixTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (s: typeof programSeatMatrixTable.$inferSelect) => ({
  id: s.id,
  programId: s.programId,
  sessionId: s.sessionId,
  totalSeats: s.totalSeats,
  openMeritSeats: s.openMeritSeats,
  minoritySeats: s.minoritySeats,
  disabilitySeats: s.disabilitySeats,
  nmuEmployeeSeats: s.nmuEmployeeSeats,
  districtSeats: s.districtSeats ?? [],
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});

router.get("/seat-matrix", requireAuth, async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.sessionId) conditions.push(eq(programSeatMatrixTable.sessionId, Number(req.query.sessionId)));
  if (req.query.programId) conditions.push(eq(programSeatMatrixTable.programId, Number(req.query.programId)));
  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db.select().from(programSeatMatrixTable).where(where);
  res.json(rows.map(fmt));
});

router.post("/seat-matrix", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const { programId, sessionId, totalSeats, openMeritSeats, minoritySeats, disabilitySeats, nmuEmployeeSeats, districtSeats } = req.body;
  if (!programId || !sessionId) {
    res.status(400).json({ error: "programId and sessionId are required" });
    return;
  }
  const [row] = await db
    .insert(programSeatMatrixTable)
    .values({ programId, sessionId, totalSeats: totalSeats ?? 0, openMeritSeats: openMeritSeats ?? 0, minoritySeats: minoritySeats ?? 0, disabilitySeats: disabilitySeats ?? 0, nmuEmployeeSeats: nmuEmployeeSeats ?? 0, districtSeats: districtSeats ?? [] })
    .onConflictDoUpdate({
      target: [programSeatMatrixTable.programId, programSeatMatrixTable.sessionId],
      set: { totalSeats: totalSeats ?? 0, openMeritSeats: openMeritSeats ?? 0, minoritySeats: minoritySeats ?? 0, disabilitySeats: disabilitySeats ?? 0, nmuEmployeeSeats: nmuEmployeeSeats ?? 0, districtSeats: districtSeats ?? [] },
    })
    .returning();
  res.status(201).json(fmt(row));
});

router.patch("/seat-matrix/:id", requireAuth, requireAdminRole, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { totalSeats, openMeritSeats, minoritySeats, disabilitySeats, nmuEmployeeSeats, districtSeats } = req.body;
  const [row] = await db
    .update(programSeatMatrixTable)
    .set({ totalSeats, openMeritSeats, minoritySeats, disabilitySeats, nmuEmployeeSeats, districtSeats: districtSeats ?? [] })
    .where(eq(programSeatMatrixTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Seat matrix entry not found" });
    return;
  }
  res.json(fmt(row));
});

export default router;

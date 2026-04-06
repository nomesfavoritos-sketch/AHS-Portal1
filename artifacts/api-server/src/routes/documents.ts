import { Router, type IRouter } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (d: typeof documentsTable.$inferSelect) => ({
  id: d.id,
  userId: d.userId,
  applicationId: d.applicationId ?? null,
  docType: d.docType,
  fileName: d.fileName,
  filePath: d.filePath,
  fileUrl: d.fileUrl ?? null,
  mimeType: d.mimeType ?? null,
  status: d.status,
  uploadedAt: d.uploadedAt.toISOString(),
});

router.get("/documents", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const userRole = sess.userRole as string;

  const conditions = [];
  if (userRole === "student") conditions.push(eq(documentsTable.userId, userId));
  if (req.query.applicationId) conditions.push(eq(documentsTable.applicationId, Number(req.query.applicationId)));
  if (req.query.docType) conditions.push(eq(documentsTable.docType, req.query.docType as string));

  const where = conditions.length ? and(...conditions) : undefined;
  const docs = await db.select().from(documentsTable).where(where).orderBy(documentsTable.uploadedAt);
  res.json(docs.map(fmt));
});

router.post("/documents", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;

  const { docType, fileName, filePath, fileUrl, mimeType, applicationId } = req.body;
  if (!docType || !fileName || !filePath) {
    res.status(400).json({ error: "docType, fileName, and filePath are required" });
    return;
  }

  // Replace existing doc of same type for this user
  const [existing] = await db.select().from(documentsTable).where(
    and(eq(documentsTable.userId, userId), eq(documentsTable.docType, docType))
  );

  if (existing) {
    const [updated] = await db.update(documentsTable).set({
      fileName, filePath, fileUrl: fileUrl ?? null, mimeType: mimeType ?? null,
      applicationId: applicationId ?? null, status: "uploaded",
      uploadedAt: new Date(),
    }).where(eq(documentsTable.id, existing.id)).returning();
    res.json(fmt(updated));
    return;
  }

  const [doc] = await db.insert(documentsTable).values({
    userId, docType, fileName, filePath,
    fileUrl: fileUrl ?? null, mimeType: mimeType ?? null,
    applicationId: applicationId ?? null, status: "uploaded",
  }).returning();
  res.status(201).json(fmt(doc));
});

router.delete("/documents/:id", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as Record<string, unknown>;
  const userId = sess.userId as number;
  const id = parseInt(req.params.id as string, 10);

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  if (doc.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.sendStatus(204);
});

export default router;

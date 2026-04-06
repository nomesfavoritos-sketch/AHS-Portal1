import { Router, type IRouter } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { UploadDocumentBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const fmt = (d: typeof documentsTable.$inferSelect) => ({
  id: d.id,
  applicationId: d.applicationId,
  docType: d.docType,
  fileName: d.fileName,
  fileUrl: d.fileUrl,
  status: d.status,
  uploadedAt: d.uploadedAt.toISOString(),
});

router.get("/documents", requireAuth, async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.applicationId) conditions.push(eq(documentsTable.applicationId, Number(req.query.applicationId)));
  const where = conditions.length ? and(...conditions) : undefined;
  const docs = await db.select().from(documentsTable).where(where).orderBy(documentsTable.uploadedAt);
  res.json(docs.map(fmt));
});

router.post("/documents", requireAuth, async (req, res): Promise<void> => {
  const parsed = UploadDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db.insert(documentsTable).values(parsed.data).returning();
  res.status(201).json(fmt(doc));
});

router.delete("/documents/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.sendStatus(204);
});

export default router;

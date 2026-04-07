import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { usersTable } from "./users";

export const ChecklistItemStatus = z.enum(["pending", "verified", "missing", "mismatch"]);
export type ChecklistItemStatus = z.infer<typeof ChecklistItemStatus>;

export const ChecklistItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  status: ChecklistItemStatus.default("pending"),
  remarks: z.string().default(""),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: "name_matches", label: "Applicant name matches documents", status: "pending", remarks: "" },
  { key: "cnic_matches", label: "CNIC/B-Form number matches", status: "pending", remarks: "" },
  { key: "domicile_matches", label: "Domicile certificate matches district", status: "pending", remarks: "" },
  { key: "matric_marks_match", label: "Matric marks match uploaded certificate", status: "pending", remarks: "" },
  { key: "fsc_marks_match", label: "FSc marks match uploaded certificate", status: "pending", remarks: "" },
  { key: "quota_valid", label: "Quota certificate valid (if applicable)", status: "pending", remarks: "" },
  { key: "payment_verified", label: "Challan payment verified", status: "pending", remarks: "" },
  { key: "documents_complete", label: "All mandatory documents present", status: "pending", remarks: "" },
];

export const verificationChecklistsTable = pgTable("verification_checklists", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().unique().references(() => applicationsTable.id, { onDelete: "cascade" }),
  officerId: integer("officer_id").references(() => usersTable.id),
  items: jsonb("items").$type<ChecklistItem[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVerificationChecklistSchema = createInsertSchema(verificationChecklistsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVerificationChecklist = z.infer<typeof insertVerificationChecklistSchema>;
export type VerificationChecklist = typeof verificationChecklistsTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { programsTable } from "./programs";
import { admissionSessionsTable } from "./sessions";
import { quotaCategoriesTable } from "./quotas";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  applicationNumber: text("application_number").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").notNull().references(() => admissionSessionsTable.id),
  programId: integer("program_id").notNull().references(() => programsTable.id),
  quotaId: integer("quota_id").references(() => quotaCategoriesTable.id),
  priority: integer("priority").notNull().default(1),
  status: text("status").notNull().default("draft"),
  remarks: text("remarks"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  meritScore: doublePrecision("merit_score"),
  meritScoreRaw: doublePrecision("merit_score_raw"),
  meritBreakdown: jsonb("merit_breakdown").$type<{
    matricMarks?: number;
    matricTotal?: number;
    matricWeight?: number;
    matricWeightedScore?: number;
    fscMarks?: number;
    fscTotal?: number;
    fscWeight?: number;
    fscWeightedScore?: number;
    rawScore?: number;
    normalizedScore?: number;
  }>().default({}),
  joiningIntentAt: timestamp("joining_intent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, applicationNumber: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;

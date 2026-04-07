import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { usersTable } from "./users";

export const joiningDecisionsTable = pgTable("joining_decisions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id, { onDelete: "cascade" }),
  officerId: integer("officer_id").notNull().references(() => usersTable.id),
  decision: text("decision").notNull(),
  checklistSnapshot: jsonb("checklist_snapshot").$type<any[]>().default([]),
  verifiedCount: integer("verified_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  remarks: text("remarks"),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJoiningDecisionSchema = createInsertSchema(joiningDecisionsTable).omit({ id: true, decidedAt: true, createdAt: true });
export type InsertJoiningDecision = z.infer<typeof insertJoiningDecisionSchema>;
export type JoiningDecision = typeof joiningDecisionsTable.$inferSelect;

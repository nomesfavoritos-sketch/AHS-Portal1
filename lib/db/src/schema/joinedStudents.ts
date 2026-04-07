import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { usersTable } from "./users";
import { admissionSessionsTable } from "./sessions";
import { programsTable } from "./programs";

export const joinedStudentsTable = pgTable("joined_students", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id).unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  sessionId: integer("session_id").notNull().references(() => admissionSessionsTable.id),
  programId: integer("program_id").notNull().references(() => programsTable.id),
  rollNumber: text("roll_number"),
  verifiedById: integer("verified_by_id").references(() => usersTable.id),
  verifierName: text("verifier_name"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp("removed_at", { withTimezone: true }),
  removedById: integer("removed_by_id").references(() => usersTable.id),
  removalReason: text("removal_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJoinedStudentSchema = createInsertSchema(joinedStudentsTable).omit({ id: true, joinedAt: true, createdAt: true });
export type InsertJoinedStudent = z.infer<typeof insertJoinedStudentSchema>;
export type JoinedStudent = typeof joinedStudentsTable.$inferSelect;

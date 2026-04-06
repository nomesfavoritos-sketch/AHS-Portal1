import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { usersTable } from "./users";

export const verificationDecisionsTable = pgTable("verification_decisions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id, { onDelete: "cascade" }),
  officerId: integer("officer_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("pending"),
  remarks: text("remarks"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verificationDecisionsTable).omit({ id: true, verifiedAt: true, createdAt: true });
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type VerificationDecision = typeof verificationDecisionsTable.$inferSelect;

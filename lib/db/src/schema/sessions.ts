import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const admissionSessionsTable = pgTable("admission_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  correctionWindowStart: text("correction_window_start"),
  correctionWindowEnd: text("correction_window_end"),
  meritPublicationDate: text("merit_publication_date"),
  joiningDeadline: text("joining_deadline"),
  isActive: boolean("is_active").notNull().default(false),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSessionSchema = createInsertSchema(admissionSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type AdmissionSession = typeof admissionSessionsTable.$inferSelect;

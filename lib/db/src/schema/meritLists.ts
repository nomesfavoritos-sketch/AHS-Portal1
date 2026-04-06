import { pgTable, text, serial, timestamp, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { admissionSessionsTable } from "./sessions";
import { programsTable } from "./programs";
import { applicationsTable } from "./applications";

export const meritListsTable = pgTable("merit_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sessionId: integer("session_id").notNull().references(() => admissionSessionsTable.id),
  programId: integer("program_id").notNull().references(() => programsTable.id),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(false),
  totalEntries: integer("total_entries").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const meritListEntriesTable = pgTable("merit_list_entries", {
  id: serial("id").primaryKey(),
  meritListId: integer("merit_list_id").notNull().references(() => meritListsTable.id, { onDelete: "cascade" }),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id),
  rank: integer("rank").notNull(),
  meritScore: doublePrecision("merit_score").notNull(),
  status: text("status").notNull().default("selected"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMeritListSchema = createInsertSchema(meritListsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMeritList = z.infer<typeof insertMeritListSchema>;
export type MeritList = typeof meritListsTable.$inferSelect;
export type MeritListEntry = typeof meritListEntriesTable.$inferSelect;

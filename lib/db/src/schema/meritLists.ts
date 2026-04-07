import { pgTable, text, serial, timestamp, integer, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { admissionSessionsTable } from "./sessions";
import { programsTable } from "./programs";
import { applicationsTable } from "./applications";
import { quotaCategoriesTable } from "./quotas";
import { usersTable } from "./users";

export const meritListsTable = pgTable("merit_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sessionId: integer("session_id").notNull().references(() => admissionSessionsTable.id),
  programId: integer("program_id").notNull().references(() => programsTable.id),
  quotaId: integer("quota_id").references(() => quotaCategoriesTable.id),
  listNumber: integer("list_number").notNull().default(1),
  versionNumber: integer("version_number").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  frozenAt: timestamp("frozen_at", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(false),
  isFrozen: boolean("is_frozen").notNull().default(false),
  totalEntries: integer("total_entries").notNull().default(0),
  generatedBy: integer("generated_by").references(() => usersTable.id),
  publishedBy: integer("published_by").references(() => usersTable.id),
  eligibilityFilters: jsonb("eligibility_filters").$type<{
    requirePaymentVerified?: boolean;
    requireDocumentsComplete?: boolean;
    statuses?: string[];
  }>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const meritListEntriesTable = pgTable("merit_list_entries", {
  id: serial("id").primaryKey(),
  meritListId: integer("merit_list_id").notNull().references(() => meritListsTable.id, { onDelete: "cascade" }),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id),
  quotaId: integer("quota_id").references(() => quotaCategoriesTable.id),
  rank: integer("rank").notNull(),
  meritScore: doublePrecision("merit_score").notNull(),
  meritScoreRaw: doublePrecision("merit_score_raw"),
  meritScoreNormalized: doublePrecision("merit_score_normalized"),
  matricScore: doublePrecision("matric_score"),
  fscScore: doublePrecision("fsc_score"),
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
  status: text("status").notNull().default("selected"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMeritListSchema = createInsertSchema(meritListsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMeritList = z.infer<typeof insertMeritListSchema>;
export type MeritList = typeof meritListsTable.$inferSelect;
export type MeritListEntry = typeof meritListEntriesTable.$inferSelect;

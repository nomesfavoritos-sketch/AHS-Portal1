import { pgTable, text, serial, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotaCategoriesTable = pgTable("quota_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  percentage: doublePrecision("percentage").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuotaSchema = createInsertSchema(quotaCategoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuota = z.infer<typeof insertQuotaSchema>;
export type QuotaCategory = typeof quotaCategoriesTable.$inferSelect;

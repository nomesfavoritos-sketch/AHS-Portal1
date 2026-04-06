import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const paymentChallansTable = pgTable("payment_challans", {
  id: serial("id").primaryKey(),
  challanNumber: text("challan_number").notNull().unique(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  bankName: text("bank_name"),
  transactionRef: text("transaction_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChallanSchema = createInsertSchema(paymentChallansTable).omit({ id: true, challanNumber: true, createdAt: true, updatedAt: true });
export type InsertChallan = z.infer<typeof insertChallanSchema>;
export type PaymentChallan = typeof paymentChallansTable.$inferSelect;

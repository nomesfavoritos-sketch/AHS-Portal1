import { pgTable, serial, integer, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { programsTable } from "./programs";
import { admissionSessionsTable } from "./sessions";

export const programSeatMatrixTable = pgTable("program_seat_matrix", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programsTable.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").notNull().references(() => admissionSessionsTable.id, { onDelete: "cascade" }),
  totalSeats: integer("total_seats").notNull().default(0),
  openMeritSeats: integer("open_merit_seats").notNull().default(0),
  minoritySeats: integer("minority_seats").notNull().default(0),
  disabilitySeats: integer("disability_seats").notNull().default(0),
  nmuEmployeeSeats: integer("nmu_employee_seats").notNull().default(0),
  districtSeats: jsonb("district_seats").$type<Array<{ district: string; seats: number }>>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  unique().on(t.programId, t.sessionId),
]);

export const insertSeatMatrixSchema = createInsertSchema(programSeatMatrixTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeatMatrix = z.infer<typeof insertSeatMatrixSchema>;
export type ProgramSeatMatrix = typeof programSeatMatrixTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer, references } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const studentProfilesTable = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  fatherName: text("father_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  cnic: text("cnic"),
  address: text("address"),
  city: text("city"),
  domicile: text("domicile"),
  religion: text("religion"),
  nationality: text("nationality"),
  matricMarks: integer("matric_marks"),
  matricTotal: integer("matric_total"),
  interMarks: integer("inter_marks"),
  interTotal: integer("inter_total"),
  interYear: integer("inter_year"),
  interBoard: text("inter_board"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type StudentProfile = typeof studentProfilesTable.$inferSelect;

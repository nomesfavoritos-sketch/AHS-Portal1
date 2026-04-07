import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const studentProfilesTable = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),

  // Personal Information
  fatherName: text("father_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  cnic: text("cnic"),
  religion: text("religion"),
  nationality: text("nationality"),
  domicileDistrict: text("domicile_district"),
  province: text("province"),
  permanentAddress: text("permanent_address"),
  presentAddress: text("present_address"),
  contactNumber: text("contact_number"),
  guardianContactNumber: text("guardian_contact_number"),
  photoPath: text("photo_path"),

  // Legacy fields (kept for backwards compat)
  address: text("address"),
  city: text("city"),
  domicile: text("domicile"),

  // Quota Information
  quotaType: text("quota_type").default("open_merit"),
  minorityDetails: text("minority_details"),
  disabilityDetails: text("disability_details"),

  // Matric / O-Level
  matricBoard: text("matric_board"),
  matricYear: integer("matric_year"),
  matricRoll: text("matric_roll"),
  matricTotal: integer("matric_total"),
  matricMarks: integer("matric_marks"),

  // FSc / A-Level
  interBoard: text("inter_board"),
  interYear: integer("inter_year"),
  interRoll: text("inter_roll"),
  interTotal: integer("inter_total"),
  interMarks: integer("inter_marks"),

  // Additional qualifications (dynamic list)
  additionalQualifications: jsonb("additional_qualifications").$type<Array<{
    degree: string;
    institution: string;
    board: string;
    year: number;
    marksObtained: number;
    totalMarks: number;
  }>>().default([]),

  // Profile completion
  isComplete: boolean("is_complete").notNull().default(false),
  completionPercentage: integer("completion_percentage").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type StudentProfile = typeof studentProfilesTable.$inferSelect;

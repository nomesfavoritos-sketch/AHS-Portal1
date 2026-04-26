import { db, usersTable, programsTable, admissionSessionsTable, quotaCategoriesTable, studentProfilesTable, noticesTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Users
  const users = [
    { email: "superadmin@ahscollege.edu.pk", fullName: "Dr. Muhammad Kashif", role: "super_admin", password: "Admin@1234" },
    { email: "admissions@ahscollege.edu.pk", fullName: "Ms. Sana Malik", role: "admission_admin", password: "Admin@1234" },
    { email: "verification@ahscollege.edu.pk", fullName: "Mr. Asif Raza", role: "verification_officer", password: "Admin@1234" },
    { email: "finance@ahscollege.edu.pk", fullName: "Mr. Bilal Ahmad", role: "finance_verifier", password: "Admin@1234" },
    { email: "student@ahscollege.edu.pk", fullName: "Ahmed Ali Khan", role: "student", password: "Student@1234" },
  ];

  const createdUsers: Array<{ id: number; email: string; role: string }> = [];

  for (const u of users) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, u.email));
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      const [user] = await db.insert(usersTable).values({
        email: u.email, fullName: u.fullName, role: u.role, passwordHash, isActive: true,
      }).returning();
      console.log(`Created user: ${user.email} (${user.role})`);
      createdUsers.push({ id: user.id, email: user.email, role: user.role });
    } else {
      console.log(`User already exists: ${u.email}`);
      createdUsers.push({ id: existing[0].id, email: existing[0].email, role: existing[0].role });
    }
  }

  // Create student profiles for student users
  for (const u of createdUsers.filter(u => u.role === "student")) {
    const existingProfile = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.userId, u.id));
    if (existingProfile.length === 0) {
      await db.insert(studentProfilesTable).values({
        userId: u.id,
        fatherName: "Ali Khan",
        dateOfBirth: "2002-05-15",
        gender: "male",
        cnic: "36302-1234567-3",
        religion: "Islam",
        nationality: "Pakistani",
        domicileDistrict: "Multan",
        province: "Punjab",
        permanentAddress: "House 12, Street 3, Model Town, Multan",
        presentAddress: "House 12, Street 3, Model Town, Multan",
        contactNumber: "0300-1234567",
        guardianContactNumber: "0301-7654321",
        quotaType: "open_merit",
        matricBoard: "BISE Multan",
        matricYear: 2020,
        matricRoll: "123456",
        matricTotal: 1100,
        matricMarks: 1050,
        interBoard: "BISE Multan",
        interYear: 2022,
        interRoll: "654321",
        interTotal: 1100,
        interMarks: 980,
        completionPercentage: 100,
        isComplete: true,
      });
      console.log(`Created student profile for ${u.email}`);
    }
  }

  // Programs — 8 Allied Health programs as specified
  const programs = [
    { name: "BS Medical Laboratory Technology", code: "BSMLT", duration: "4 years", seats: 60, description: "Bachelor of Science in Medical Laboratory Technology", isActive: true },
    { name: "BS Medical Imaging Technology", code: "BSMIT", duration: "4 years", seats: 40, description: "Bachelor of Science in Medical Imaging Technology (Radiology)", isActive: true },
    { name: "BS Renal Dialysis Technology", code: "BSRDT", duration: "4 years", seats: 30, description: "Bachelor of Science in Renal Dialysis Technology", isActive: true },
    { name: "BS Optometry & Orthotics Technology", code: "BSOOT", duration: "4 years", seats: 30, description: "Bachelor of Science in Optometry and Orthotics Technology", isActive: true },
    { name: "BS Anesthesia Technology", code: "BSANT", duration: "4 years", seats: 25, description: "Bachelor of Science in Anesthesia Technology", isActive: true },
    { name: "BS Endoscopy Technology", code: "BSEND", duration: "4 years", seats: 20, description: "Bachelor of Science in Endoscopy Technology", isActive: true },
    { name: "BS Dental Technology", code: "BSDNT", duration: "4 years", seats: 25, description: "Bachelor of Science in Dental Technology", isActive: true },
    { name: "BS Orthotics & Prosthetics Technology", code: "BSOPT", duration: "4 years", seats: 20, description: "Bachelor of Science in Orthotics and Prosthetics Technology", isActive: true },
  ];

  for (const p of programs) {
    const existing = await db.select().from(programsTable).where(eq(programsTable.code, p.code));
    if (existing.length === 0) {
      const [prog] = await db.insert(programsTable).values(p).returning();
      console.log(`Created program: ${prog.name}`);
    } else {
      // Update seats/description if different
      await db.update(programsTable).set({ name: p.name, seats: p.seats, description: p.description }).where(eq(programsTable.code, p.code));
      console.log(`Updated program: ${p.name}`);
    }
  }

  // Quota Categories
  const quotas = [
    { name: "Open Merit", code: "OM", percentage: 60, description: "Open merit seats available to all candidates", isActive: true },
    { name: "Special Persons / Disability", code: "SP", percentage: 2, description: "Seats reserved for special/disabled persons", isActive: true },
    { name: "Overseas Pakistanis", code: "OP", percentage: 5, description: "Seats for overseas Pakistanis", isActive: true },
    { name: "Minorities", code: "MIN", percentage: 3, description: "Seats reserved for minority communities", isActive: true },
    { name: "Sports", code: "SPT", percentage: 2, description: "Seats for outstanding sports persons", isActive: true },
    { name: "Self Finance", code: "SF", percentage: 28, description: "Self-finance seats", isActive: true },
  ];

  for (const q of quotas) {
    const existing = await db.select().from(quotaCategoriesTable).where(eq(quotaCategoriesTable.code, q.code));
    if (existing.length === 0) {
      const [quota] = await db.insert(quotaCategoriesTable).values(q).returning();
      console.log(`Created quota: ${quota.name}`);
    }
  }

  // Admission Session
  const existingSessions = await db.select().from(admissionSessionsTable);
  if (existingSessions.length === 0) {
    await db.insert(admissionSessionsTable).values({
      name: "Admission Session 2025-26",
      year: 2025,
      startDate: "2025-07-01",
      endDate: "2025-08-31",
      isActive: true,
      status: "open",
    });
    console.log("Created admission session 2025-26");
  }

  // Notices
  const adminUser = createdUsers.find(u => u.role === "super_admin");
  if (adminUser) {
    const existingNotices = await db.select().from(noticesTable);
    if (existingNotices.length === 0) {
      await db.insert(noticesTable).values([
        {
          title: "Admissions Open for Session 2025-26",
          content: "Allied Health College, Nishtar Medical University announces the commencement of admissions for the session 2025-26. Eligible candidates are encouraged to apply online through the AHS Portal.",
          category: "admission", isActive: true, createdBy: adminUser.id, publishedAt: new Date(),
        },
        {
          title: "Last Date for Fee Submission",
          content: "All admitted students must submit their admission fee by August 31, 2025. Challan can be generated from the student portal. Late submissions will not be accepted.",
          category: "payment", isActive: true, createdBy: adminUser.id, publishedAt: new Date(),
        },
        {
          title: "Merit List Publication Date",
          content: "The first merit list for Session 2025-26 will be published on September 5, 2025. Candidates are advised to check their status on the portal.",
          category: "merit", isActive: true, createdBy: adminUser.id, publishedAt: new Date(),
        },
        {
          title: "Required Documents for Submission",
          content: "All applicants must upload: CNIC/B-Form, Father's CNIC, Matric Certificate, FSc Certificate, Domicile Certificate, and Paid Challan Slip before final submission.",
          category: "admission", isActive: true, createdBy: adminUser.id, publishedAt: new Date(),
        },
      ]);
      console.log("Created sample notices");
    }
  }

  console.log("\nSeed complete!");
  console.log("\n=== Demo Credentials ===");
  console.log("Super Admin:          superadmin@ahscollege.edu.pk  /  Admin@1234");
  console.log("Admission Admin:      admissions@ahscollege.edu.pk  /  Admin@1234");
  console.log("Verification Officer: verification@ahscollege.edu.pk /  Admin@1234");
  console.log("Finance Verifier:     finance@ahscollege.edu.pk     /  Admin@1234");
  console.log("Student:              student@ahscollege.edu.pk     /  Student@1234");
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

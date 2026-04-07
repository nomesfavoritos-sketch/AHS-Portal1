import { Link } from "wouter";
import { useListNotices, useListPrograms } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Building2, ArrowRight, CheckCircle, Clock, FileText, CreditCard, ClipboardCheck, Award, Users, GraduationCap, Search, Bell, Phone, Mail, MapPin, ChevronRight, Microscope, Eye, Heart, Activity, Smile, Bone
} from "lucide-react";
import { format } from "date-fns";

const STEPS = [
  { icon: FileText, title: "Create Account", desc: "Register with your CNIC and personal details." },
  { icon: Users, title: "Complete Profile", desc: "Fill in your academic and personal information." },
  { icon: GraduationCap, title: "Select Program", desc: "Choose your desired Allied Health program." },
  { icon: CreditCard, title: "Pay Fee Challan", desc: "Deposit PKR 500 application fee at any HBL branch." },
  { icon: ClipboardCheck, title: "Submit Application", desc: "Upload paid slip and submit your application." },
  { icon: Award, title: "Check Merit List", desc: "Check merit rankings and confirm joining intent." },
];

const PROGRAM_ICONS: Record<string, React.ElementType> = {
  BSMLT: Microscope,
  BSMIT: Eye,
  BSRDT: Activity,
  BSOOT: Eye,
  BSANT: Heart,
  BSEND: Activity,
  BSDNT: Smile,
  BSOPT: Bone,
};

const FAQ = [
  {
    q: "What programs are offered at Allied Health College?",
    a: "We offer 8 Allied Health Sciences programs: Medical Lab Technology (BSMLT), Medical Imaging Technology (BSMIT), Renal Dialysis Technology (BSRDT), Optometry (BSOOT), Anesthesia Technology (BSANT), Endoscopy Technology (BSEND), Dental Technology (BSDNT), and Orthotics & Prosthetics (BSOPT)."
  },
  {
    q: "What is the minimum eligibility to apply?",
    a: "Applicants must have passed FSc (Pre-Medical) with at least 50% marks from an HEC-recognized board. A valid Domicile from Punjab province is required. CNIC/B-Form is mandatory for registration."
  },
  {
    q: "How is the merit calculated?",
    a: "Merit is calculated as: Merit% = ((Matric Marks / Matric Total × 10) + (FSc Marks / FSc Total × 70)) / 80 × 100. FSc marks carry the highest weightage at 70%."
  },
  {
    q: "What documents are required for admission?",
    a: "You'll need: Matric Certificate & Marksheet, FSc Certificate & Marksheet, Domicile Certificate, CNIC/B-Form (original + copy), Passport Photo, Character Certificate, and Medical Fitness Certificate."
  },
  {
    q: "How do I pay the application fee?",
    a: "Generate your challan from the portal after creating an application. Deposit the challan at any HBL branch. Then upload the bank-stamped paid slip in the portal to proceed."
  },
  {
    q: "When are merit lists published?",
    a: "Merit lists are published after the admission window closes and all applications are reviewed. You'll receive a notification on the portal. You can also use the Merit Search feature to check your status."
  },
  {
    q: "What happens after being selected for verification?",
    a: "You will be asked to report to the Verification Desk at Allied Health College with all original documents. Working hours are Monday–Friday, 8am–2pm. Bring all originals plus photocopies."
  },
  {
    q: "Can I apply under a quota category?",
    a: "Yes. We offer Special Quotas for minorities, students with disabilities, and children of NMU employees. Select your category during the application process and ensure you have supporting documentation."
  },
];

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    general: "bg-slate-100 text-slate-700",
    admission: "bg-blue-100 text-blue-700",
    merit: "bg-purple-100 text-purple-700",
    payment: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[category] ?? colors.general}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
}

export default function Home() {
  const { data: notices } = useListNotices({ active: "true" } as any);
  const { data: programs } = useListPrograms();

  const activeNotices = (notices ?? []).filter(n => n.isActive).slice(0, 6);
  const activePrograms = (programs ?? []).filter(p => p.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky Header */}
      <header className="px-6 py-3 border-b flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-50 shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block leading-tight">AHS Portal</span>
            <span className="text-[10px] text-muted-foreground leading-tight block">Nishtar Medical University</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#programs" className="text-muted-foreground hover:text-foreground transition-colors">Programs</a>
          <a href="#process" className="text-muted-foreground hover:text-foreground transition-colors">How to Apply</a>
          <a href="#notices" className="text-muted-foreground hover:text-foreground transition-colors">Notices</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          <Link href="/merit-search">
            <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Merit Search</span>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Apply Now</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3 pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Admissions Portal — Allied Health College
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Begin Your Career in{" "}
              <span className="text-primary">Allied Health Sciences</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              The official admissions portal for Allied Health College, Nishtar Medical University, Multan. Apply for BSc programs, track your merit status, and manage your admission journey — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
                  Start Your Application <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/merit-search">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
                  <Search className="h-4 w-4" /> Check Merit Status
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
              {[
                { label: "8 Programs", icon: GraduationCap },
                { label: "4-Year BSc Degrees", icon: Award },
                { label: "NMU Affiliated", icon: Building2 },
                { label: "Merit-Based Admissions", icon: ClipboardCheck },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Apply */}
        <section id="process" className="py-16 px-6 bg-muted/30 border-t">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">How to Apply</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Follow these six simple steps to complete your admission application from registration to merit listing.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <div key={i} className="bg-background rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">Step {i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programs */}
        <section id="programs" className="py-16 px-6 border-t">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Allied Health Programs</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Choose from 8 specialized 4-year BSc programs designed to train professionals in critical health disciplines.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activePrograms.length > 0 ? activePrograms.map((program) => {
                const Icon = PROGRAM_ICONS[program.code] ?? Microscope;
                return (
                  <div key={program.id} className="bg-background rounded-xl p-5 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{program.name}</h3>
                    <p className="text-xs text-primary font-mono mb-2">{program.code}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{program.duration} years</span>
                      {program.seats && <span className="text-xs text-muted-foreground">{program.seats} seats</span>}
                    </div>
                  </div>
                );
              }) : (
                [
                  { name: "Medical Lab Technology", code: "BSMLT", icon: Microscope },
                  { name: "Medical Imaging Technology", code: "BSMIT", icon: Eye },
                  { name: "Renal Dialysis Technology", code: "BSRDT", icon: Activity },
                  { name: "Optometry", code: "BSOOT", icon: Eye },
                  { name: "Anesthesia Technology", code: "BSANT", icon: Heart },
                  { name: "Endoscopy Technology", code: "BSEND", icon: Activity },
                  { name: "Dental Technology", code: "BSDNT", icon: Smile },
                  { name: "Orthotics & Prosthetics", code: "BSOPT", icon: Bone },
                ].map((p) => (
                  <div key={p.code} className="bg-background rounded-xl p-5 border shadow-sm">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
                    <p className="text-xs text-primary font-mono mb-2">{p.code}</p>
                    <span className="text-xs text-muted-foreground">4 years</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Eligibility */}
        <section className="py-16 px-6 bg-muted/30 border-t">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Eligibility Criteria</h2>
              <p className="text-muted-foreground">Minimum requirements to be eligible for admission.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Academic Requirement", items: ["FSc (Pre-Medical) with minimum 50% marks", "Matric (Science subjects) with minimum 50% marks", "Degree from HEC-recognized institution"] },
                { title: "Documentation", items: ["Valid CNIC or B-Form (Pakistani national)", "Domicile Certificate from Punjab", "Medical Fitness Certificate from authorized doctor"] },
                { title: "Other Requirements", items: ["Character Certificate from last institution", "Passport-size photographs (recent)", "Joining deadline compliance after selection"] },
                { title: "Quota Eligibility", items: ["Minority quota: Non-Muslim candidates with certificate", "Disability quota: Disability certificate from authorized authority", "NMU Employee quota: Valid employment proof of parent/guardian"] },
              ].map((section) => (
                <div key={section.title} className="bg-background rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notices */}
        <section id="notices" className="py-16 px-6 border-t">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">Important Notices</h2>
                <p className="text-muted-foreground">Latest announcements from the Admissions Office.</p>
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                  <Bell className="h-3.5 w-3.5" /> View All
                </Button>
              </Link>
            </div>
            {activeNotices.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeNotices.map((notice) => (
                  <div key={notice.id} className="bg-background rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <CategoryBadge category={notice.category} />
                      <span className="text-xs text-muted-foreground">
                        {notice.publishedAt ? format(new Date(notice.publishedAt), "MMM d, yyyy") : format(new Date(notice.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2 leading-snug">{notice.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{notice.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No active notices at this time. Check back soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* Merit Search CTA */}
        <section className="py-12 px-6 bg-primary text-primary-foreground border-t">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Check Your Merit Status</h2>
              <p className="text-primary-foreground/80 text-sm">Search by CNIC or Application Number to view your merit ranking instantly.</p>
            </div>
            <Link href="/merit-search">
              <Button variant="secondary" size="lg" className="gap-2 whitespace-nowrap">
                <Search className="h-4 w-4" /> Merit Search
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 px-6 border-t">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about the admission process.</p>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium text-sm py-4 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 px-6 bg-muted/30 border-t">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Contact & Help</h2>
              <p className="text-muted-foreground">Reach out to the Admissions Office for any queries.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Phone, title: "Phone", lines: ["+92-61-XXXXXXX", "Mon–Fri, 8am–2pm"] },
                { icon: Mail, title: "Email", lines: ["admissions@ahscollege.edu.pk", "Reply within 48 hours"] },
                { icon: MapPin, title: "Address", lines: ["Allied Health College", "Nishtar Medical University, Multan"] },
              ].map(({ icon: Icon, title, lines }) => (
                <div key={title} className="bg-background rounded-xl p-6 border text-center shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  {lines.map(l => <p key={l} className="text-sm text-muted-foreground">{l}</p>)}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-6 border-t">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Apply?</h2>
            <p className="text-muted-foreground mb-8">Create your account today and take the first step towards your career in Allied Health Sciences.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-12 px-10 text-base gap-2">
                  Create Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-10 text-base">
                  Sign In to Portal
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t bg-muted/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Allied Health College, NMU</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Allied Health College, Nishtar Medical University, Multan. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/merit-search"><span className="hover:text-foreground cursor-pointer">Merit Search</span></Link>
            <Link href="/login"><span className="hover:text-foreground cursor-pointer">Sign In</span></Link>
            <Link href="/register"><span className="hover:text-foreground cursor-pointer">Apply</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

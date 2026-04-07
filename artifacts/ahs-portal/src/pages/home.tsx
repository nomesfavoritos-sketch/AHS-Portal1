import { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useInView, animate } from "framer-motion";
import { useListNotices, useListPrograms } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowRight, CheckCircle, FileText, CreditCard, ClipboardCheck, Award, Users,
  GraduationCap, Search, Bell, Phone, Mail, MapPin, Microscope, Eye, Heart,
  Activity, Smile, Bone, Shield, Star, Zap, Globe, BookOpen, FlaskConical
} from "lucide-react";
import { format } from "date-fns";
import universityPhoto from "@assets/jjjlllji_1775576930917.webp";
import nmuLogo from "@assets/logo_(1)_1775576288927.webp";

/* ─── Pakistan Institutional Green Palette ─── */
// Primary: #01411C (flag green)
// Emerald accent: #059669
// Gold: #B7903A
// Light green: #16a34a

/* ─── Framer Motion Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/* ─── Animated Counter ─── */
function AnimatedCounter({ to, suffix = "", duration = 1.8 }: { to: number; suffix?: string; duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !nodeRef.current) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate(v) {
        if (nodeRef.current) nodeRef.current.textContent = Math.round(v).toLocaleString() + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, duration]);
  return <span ref={ref}><span ref={nodeRef}>0{suffix}</span></span>;
}

/* ─── Scroll-reveal section ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Program config ─── */
const PROGRAM_ICONS: Record<string, React.ElementType> = {
  BSMLT: Microscope, BSMIT: Eye, BSRDT: Activity, BSOOT: Globe,
  BSANT: Heart, BSEND: FlaskConical, BSDNT: Smile, BSOPT: Bone,
};
const FALLBACK_PROGRAMS = [
  { code: "BSMLT", name: "Medical Lab Technology", id: 1 },
  { code: "BSMIT", name: "Medical Imaging Technology", id: 2 },
  { code: "BSRDT", name: "Renal Dialysis Technology", id: 3 },
  { code: "BSOOT", name: "Optometry", id: 4 },
  { code: "BSANT", name: "Anesthesia Technology", id: 5 },
  { code: "BSEND", name: "Endoscopy Technology", id: 6 },
  { code: "BSDNT", name: "Dental Technology", id: 7 },
  { code: "BSOPT", name: "Orthotics & Prosthetics", id: 8 },
];
const STEPS = [
  { icon: Users, title: "Create Account", desc: "Register with your CNIC and personal information." },
  { icon: FileText, title: "Complete Profile", desc: "Fill academic qualifications and upload documents." },
  { icon: GraduationCap, title: "Select Program", desc: "Choose from 8 specialised Allied Health programs." },
  { icon: CreditCard, title: "Pay Fee Challan", desc: "Deposit PKR 500 application fee at any HBL branch." },
  { icon: ClipboardCheck, title: "Submit Application", desc: "Upload the paid slip and submit your application." },
  { icon: Award, title: "Check Merit List", desc: "View your ranking and confirm joining intent." },
];
const FAQ = [
  { q: "What programs are offered at Allied Health College?", a: "We offer 8 Allied Health Sciences programs: Medical Lab Technology (BSMLT), Medical Imaging Technology (BSMIT), Renal Dialysis Technology (BSRDT), Optometry (BSOOT), Anesthesia Technology (BSANT), Endoscopy Technology (BSEND), Dental Technology (BSDNT), and Orthotics & Prosthetics (BSOPT). All are 4-year BSc degrees affiliated with Nishtar Medical University." },
  { q: "What is the minimum eligibility to apply?", a: "Applicants must have passed FSc (Pre-Medical) with at least 50% marks from an HEC-recognized board. A valid Domicile from Punjab province is required. CNIC/B-Form is mandatory for registration." },
  { q: "How is the merit calculated?", a: "Merit% = ((Matric Marks / Matric Total × 10) + (FSc Marks / FSc Total × 70)) / 80 × 100. FSc marks carry the highest weightage at 70%." },
  { q: "What documents are required?", a: "Matric Certificate & Marksheet, FSc Certificate & Marksheet, Domicile Certificate, CNIC/B-Form (original + photocopy), Passport Photo, Character Certificate, and Medical Fitness Certificate." },
  { q: "How do I pay the application fee?", a: "Generate your challan from the portal, deposit at any HBL branch, then upload the bank-stamped paid slip in the portal to proceed." },
  { q: "When are merit lists published?", a: "Merit lists are published after the admission window closes. You will receive a portal notification and can use Merit Search to check your status at any time." },
  { q: "What happens after being selected for verification?", a: "Report to the Verification Desk at Allied Health College with all original documents during working hours: Monday–Friday, 8am–2pm." },
  { q: "Can I apply under a quota category?", a: "Yes. Special quotas are available for minorities, persons with disabilities, and children of NMU employees. Select your category during the application process and provide supporting documentation." },
];

const CAT_STYLES: Record<string, string> = {
  general: "bg-slate-100 text-slate-700 border-slate-200",
  admission: "bg-green-50 text-green-800 border-green-200",
  merit: "bg-emerald-50 text-emerald-800 border-emerald-200",
  payment: "bg-amber-50 text-amber-800 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200 font-semibold",
};

export default function Home() {
  const { data: notices } = useListNotices({ active: "true" } as any);
  const { data: programs } = useListPrograms();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const activeNotices = (notices ?? []).filter(n => n.isActive).slice(0, 6);
  const displayPrograms = (programs ?? []).filter(p => p.isActive).length > 0
    ? (programs ?? []).filter(p => p.isActive)
    : FALLBACK_PROGRAMS;

  return (
    <div className="min-h-screen flex flex-col bg-white text-foreground overflow-x-hidden">

      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className={`px-6 lg:px-12 py-3 flex items-center justify-between fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/70" : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src={nmuLogo} alt="NMU Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
          <div>
            <span className="font-extrabold text-[13px] tracking-tight block leading-tight" style={{ color: "#01411C" }}>AHS Portal</span>
            <span className="text-[10px] text-slate-500 leading-tight block">Nishtar Medical University</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium">
          {[["Programs", "#programs"], ["How to Apply", "#how-to-apply"], ["Notices", "#notices"], ["FAQ", "#faq"]].map(([label, href]) => (
            <a key={label} href={href} className="text-slate-600 hover:text-[#01411C] transition-colors relative group">
              {label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#01411C] group-hover:w-full transition-all duration-200" />
            </a>
          ))}
          <Link href="/merit-search">
            <span className="text-slate-600 hover:text-[#01411C] transition-colors cursor-pointer relative group">
              Merit Search
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#01411C] group-hover:w-full transition-all duration-200" />
            </span>
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="ghost" size="sm" className="text-[13px] font-medium text-slate-700">Sign in</Button>
            </motion.div>
          </Link>
          <Link href="/register">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button size="sm" className="text-[13px] font-semibold px-5 rounded-lg shadow-md" style={{ background: "linear-gradient(135deg, #01411C, #16a34a)", boxShadow: "0 4px 14px rgba(1,65,28,0.3)" }}>
                Apply Now
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 pt-16">

        {/* ══════ HERO ══════ */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden">
          {/* University aerial photo background */}
          <div className="absolute inset-0">
            <img
              src={universityPhoto}
              alt="Nishtar Medical University, Multan"
              className="w-full h-full object-cover object-center"
              style={{ filter: "brightness(0.6) saturate(0.85)" }}
            />
          </div>
          {/* Lighter green tint overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(150deg, rgba(1,65,28,0.58) 0%, rgba(2,89,31,0.40) 55%, rgba(1,65,28,0.28) 100%)" }} />
          {/* Bottom fade to white */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
          {/* Left darkening for text legibility only */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.28) 0%, transparent 50%)" }} />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-28 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: Copy */}
              <motion.div initial="hidden" animate="show" variants={staggerContainer}>
                {/* Institution branding row */}
                <motion.div variants={fadeUp} className="flex items-center gap-3 mb-7">
                  <img src={nmuLogo} alt="NMU Logo" className="h-16 w-16 object-contain drop-shadow-lg" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }} />
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">Allied Health College</p>
                    <p className="text-white/60 text-xs leading-tight">Nishtar Medical University, Multan</p>
                  </div>
                </motion.div>

                {/* Live badge */}
                <motion.div variants={fadeUp} className="mb-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-white/90">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                    </span>
                    Admissions Open — Session 2025–26
                  </span>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.08] mb-6">
                    Begin Your Career<br />
                    <span style={{ color: "#86efac" }}>in Allied Health</span><br />
                    Sciences
                  </h1>
                </motion.div>

                <motion.p variants={fadeUp} className="text-base text-white/65 leading-relaxed mb-9 max-w-[480px]">
                  Official admissions portal for Allied Health College, Nishtar Medical University, Multan — the premier institution for Allied Health Sciences in southern Punjab.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="h-12 px-8 text-[15px] font-semibold gap-2 rounded-lg shadow-xl" style={{ background: "white", color: "#01411C" }}>
                        Start Application <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/merit-search">
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" variant="outline" className="h-12 px-8 text-[15px] font-semibold gap-2 rounded-lg border-white/30 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm">
                        <Search className="h-4 w-4" /> Check Merit Status
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>

                <motion.div variants={staggerContainer} className="flex flex-wrap gap-2.5">
                  {[
                    { icon: GraduationCap, label: "8 BSc Programs" },
                    { icon: Shield, label: "HEC Recognized" },
                    { icon: Star, label: "NMU Affiliated" },
                    { icon: Zap, label: "Merit-Based" },
                  ].map(({ icon: Icon, label }) => (
                    <motion.div key={label} variants={scaleIn} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm px-3.5 py-1.5 text-xs text-white/75 font-medium">
                      <Icon className="h-3.5 w-3.5 text-emerald-300" />
                      {label}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right: Stat Cards */}
              <motion.div initial="hidden" animate="show" variants={staggerContainer} className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { label: "Programs Offered", value: 8, suffix: "", icon: GraduationCap },
                  { label: "Years Established", value: 15, suffix: "+", icon: Star },
                  { label: "Students Enrolled", value: 1200, suffix: "+", icon: Users },
                  { label: "Seats Available", value: 320, suffix: "", icon: Award },
                ].map(({ label, value, suffix, icon: Icon }) => (
                  <motion.div
                    key={label}
                    variants={scaleIn}
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="rounded-2xl p-6 flex flex-col gap-3"
                    style={{
                      background: "rgba(0,0,0,0.40)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1.5px solid rgba(255,255,255,0.20)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.40)",
                    }}
                  >
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-4xl font-black text-white">
                      <AnimatedCounter to={value} suffix={suffix} />
                    </p>
                    <p className="text-white/70 text-xs font-semibold tracking-wide uppercase">{label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Scroll cue */}
            <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" animate={{ y: [0, 7, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
              <span className="text-white/30 text-[10px] font-medium tracking-widest uppercase">Scroll</span>
              <div className="w-px h-7 bg-gradient-to-b from-white/25 to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* ══════ STATS STRIP ══════ */}
        <section className="bg-white border-b border-slate-100">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto px-6 lg:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { label: "Allied Health Programs", value: 8, suffix: "", color: "#01411C" },
              { label: "Total Seats per Session", value: 320, suffix: "", color: "#01411C" },
              { label: "Established", value: 2009, suffix: "", color: "#01411C" },
              { label: "Graduate Success Rate", value: 94, suffix: "%", color: "#01411C" },
            ].map(({ label, value, suffix, color }) => (
              <motion.div key={label} variants={scaleIn} className="text-center">
                <p className="text-4xl font-black" style={{ color }}>
                  <AnimatedCounter to={value} suffix={suffix} />
                </p>
                <p className="text-sm text-slate-500 mt-1.5 font-medium">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ══════ PROGRAMS ══════ */}
        <section id="programs" className="py-20 px-6 lg:px-12 bg-[#f9fafb]">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#01411C" }}>Our Programs</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">
                8 Specialised Allied Health<br />
                <span style={{ color: "#01411C" }}>Disciplines</span>
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
                Four-year HEC-recognized BSc programs at Nishtar Medical University, Multan.
              </p>
            </Reveal>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {displayPrograms.map((program, i) => {
                const Icon = PROGRAM_ICONS[(program as any).code] ?? Microscope;
                return (
                  <motion.div
                    key={(program as any).code ?? i}
                    variants={scaleIn}
                    whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(1,65,28,0.12)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-green-200 transition-colors duration-200"
                  >
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(1,65,28,0.07)" }}>
                      <Icon className="h-6 w-6" style={{ color: "#01411C" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[14px] text-slate-900 mb-1 leading-tight">{program.name}</h3>
                      <p className="text-xs font-mono font-bold mb-3" style={{ color: "#01411C" }}>{(program as any).code}</p>
                      <div className="flex gap-2">
                        <span className="text-[11px] border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-500 font-medium">4 Years</span>
                        <span className="text-[11px] border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-500 font-medium">BSc</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ══════ HOW TO APPLY ══════ */}
        <section id="how-to-apply" className="py-20 px-6 lg:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#01411C" }}>Application Process</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">
                Six Steps to <span style={{ color: "#01411C" }}>Admission</span>
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
                A straightforward process from registration to merit listing.
              </p>
            </Reveal>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="border border-slate-200 rounded-2xl p-6 bg-[#f9fafb] hover:border-green-200 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #01411C, #16a34a)" }}>
                      <step.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-3xl font-black select-none" style={{ color: "rgba(1,65,28,0.12)" }}>0{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-[15px] text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <Reveal delay={0.3} className="text-center mt-10">
              <Link href="/register">
                <motion.div className="inline-block" whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-12 px-10 text-[15px] font-semibold gap-2 rounded-lg shadow-lg" style={{ background: "linear-gradient(135deg, #01411C, #16a34a)", boxShadow: "0 8px 24px rgba(1,65,28,0.25)" }}>
                    Begin Your Application <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══════ ELIGIBILITY ══════ */}
        <section className="py-20 px-6 lg:px-12 bg-[#f9fafb]">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#01411C" }}>Eligibility</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">
                Admission <span style={{ color: "#01411C" }}>Requirements</span>
              </h2>
            </Reveal>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-5"
            >
              {[
                { title: "Academic Requirement", icon: BookOpen, items: ["FSc (Pre-Medical) with minimum 50% marks", "Matric (Science subjects) with minimum 50% marks", "From an HEC-recognized institution"] },
                { title: "Documentation", icon: FileText, items: ["Valid CNIC or B-Form (Pakistani national)", "Domicile Certificate from Punjab Province", "Medical Fitness Certificate from authorized doctor"] },
                { title: "Other Requirements", icon: CheckCircle, items: ["Character Certificate from last institution", "Passport-size photographs (recent, plain background)", "Compliance with joining deadline after selection"] },
                { title: "Special Quota Eligibility", icon: Shield, items: ["Minority quota — valid non-Muslim certificate required", "Disability quota — certificate from authorized authority", "NMU Employee quota — valid employment proof of parent"] },
              ].map(({ title, icon: Icon, items }) => (
                <motion.div
                  key={title}
                  variants={scaleIn}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(1,65,28,0.07)" }}>
                      <Icon className="h-5 w-5" style={{ color: "#01411C" }} />
                    </div>
                    <h3 className="font-bold text-[15px] text-slate-900">{title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {items.map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#16a34a" }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════ NOTICES ══════ */}
        <section id="notices" className="py-20 px-6 lg:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#01411C" }}>Latest Updates</p>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                    Important <span style={{ color: "#01411C" }}>Notices</span>
                  </h2>
                </div>
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" className="gap-2 rounded-lg font-medium border-slate-300">
                      <Bell className="h-4 w-4" /> View All
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </Reveal>

            {activeNotices.length > 0 ? (
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                variants={staggerContainer}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {activeNotices.map(notice => (
                  <motion.div
                    key={notice.id}
                    variants={scaleIn}
                    whileHover={{ y: -5, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col hover:border-green-200 transition-colors duration-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${CAT_STYLES[notice.category] ?? CAT_STYLES.general}`}>
                        {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {notice.publishedAt ? format(new Date(notice.publishedAt), "MMM d, yyyy") : format(new Date(notice.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-bold text-[14px] text-slate-900 mb-2 leading-snug">{notice.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 flex-1 leading-relaxed">{notice.content}</p>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Reveal>
                <div className="text-center py-14 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No active notices at this time.</p>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* ══════ MERIT SEARCH CTA ══════ */}
        <section className="py-6 px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="max-w-7xl mx-auto rounded-2xl px-10 py-14 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #01411C 0%, #02591f 50%, #016624 100%)" }}
          >
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-[0.06] pointer-events-none" style={{ background: "radial-gradient(circle, white, transparent 70%)", transform: "translate(30%, -30%)" }} />
            <div className="relative text-center lg:text-left">
              <p className="text-green-300 text-sm font-semibold uppercase tracking-widest mb-2">Merit Search</p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Check Your Merit Status</h2>
              <p className="text-white/60 text-base max-w-md">
                Search by CNIC or Application Number to instantly view your merit ranking.
              </p>
            </div>
            <Link href="/merit-search">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="h-12 px-10 text-[15px] font-bold gap-2 rounded-lg shadow-xl whitespace-nowrap" style={{ background: "white", color: "#01411C" }}>
                  <Search className="h-5 w-5" /> Search Merit List
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </section>

        {/* ══════ FAQ ══════ */}
        <section id="faq" className="py-20 px-6 lg:px-12 bg-[#f9fafb]">
          <div className="max-w-4xl mx-auto">
            <Reveal className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#01411C" }}>FAQ</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">
                Frequently Asked <span style={{ color: "#01411C" }}>Questions</span>
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto">Everything you need to know about the admission process.</p>
            </Reveal>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
              <Accordion type="single" collapsible className="space-y-2.5">
                {FAQ.map((item, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <AccordionItem
                      value={`item-${i}`}
                      className="border border-slate-200 rounded-xl px-5 bg-white hover:border-green-200 hover:shadow-sm transition-all duration-200"
                    >
                      <AccordionTrigger className="text-left font-semibold text-[14px] py-4 hover:no-underline text-slate-800">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-500 pb-4 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ══════ CONTACT ══════ */}
        <section className="py-20 px-6 lg:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#01411C" }}>Contact Us</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Admissions <span style={{ color: "#01411C" }}>Office</span>
              </h2>
            </Reveal>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-5"
            >
              {[
                { icon: Phone, title: "Phone", lines: ["+92-61-XXXXXXX", "Mon–Fri, 8:00am – 2:00pm"] },
                { icon: Mail, title: "Email", lines: ["admissions@ahscollege.edu.pk", "Reply within 48 working hours"] },
                { icon: MapPin, title: "Address", lines: ["Allied Health College", "Nishtar Medical University, Multan"] },
              ].map(({ icon: Icon, title, lines }) => (
                <motion.div
                  key={title}
                  variants={scaleIn}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="bg-[#f9fafb] border border-slate-200 rounded-2xl p-8 text-center hover:shadow-md hover:border-green-200 transition-all duration-200"
                >
                  <div className="h-13 w-13 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(1,65,28,0.07)", width: 52, height: 52 }}>
                    <Icon className="h-6 w-6" style={{ color: "#01411C" }} />
                  </div>
                  <h3 className="font-bold text-[15px] text-slate-900 mb-2.5">{title}</h3>
                  {lines.map(l => <p key={l} className="text-sm text-slate-500 leading-relaxed">{l}</p>)}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════ FINAL CTA ══════ */}
        <section className="py-20 px-6 lg:px-12 bg-[#f9fafb] border-t border-slate-100">
          <Reveal className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#01411C" }}>Apply Today</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900">
              Your Journey Begins <span style={{ color: "#01411C" }}>Here</span>
            </h2>
            <p className="text-slate-500 text-base mb-9 leading-relaxed">
              Create your account and take the first step towards a rewarding career in Allied Health Sciences at Nishtar Medical University.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-12 px-12 text-[15px] font-semibold gap-2 rounded-lg shadow-lg" style={{ background: "linear-gradient(135deg, #01411C, #16a34a)", boxShadow: "0 8px 24px rgba(1,65,28,0.25)" }}>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="outline" className="h-12 px-12 text-[15px] font-semibold rounded-lg border-slate-300">
                    Sign In to Portal
                  </Button>
                </motion.div>
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={nmuLogo} alt="NMU Logo" className="h-10 w-10 object-contain" />
            <div>
              <span className="font-extrabold text-[13px] block leading-tight" style={{ color: "#01411C" }}>Allied Health College</span>
              <span className="text-[11px] text-slate-500">Nishtar Medical University, Multan</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} Allied Health College, Nishtar Medical University. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs font-medium text-slate-500">
            <Link href="/merit-search"><span className="hover:text-[#01411C] cursor-pointer transition-colors">Merit Search</span></Link>
            <Link href="/login"><span className="hover:text-[#01411C] cursor-pointer transition-colors">Sign In</span></Link>
            <Link href="/register"><span className="hover:text-[#01411C] cursor-pointer transition-colors">Apply Now</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

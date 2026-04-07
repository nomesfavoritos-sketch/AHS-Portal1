import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, useInView, animate } from "framer-motion";
import { useListNotices, useListPrograms } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowRight, CheckCircle, FileText, CreditCard, ClipboardCheck, Award, Users,
  GraduationCap, Search, Bell, Phone, Mail, MapPin, Microscope, Eye, Heart,
  Activity, Smile, Bone, Shield, Star, Zap, Globe, BookOpen, FlaskConical, ChevronRight,
  Menu, X
} from "lucide-react";
import { format } from "date-fns";
import universityPhoto from "@assets/jjjlllji_1775576930917.webp";
import nmuLogo from "@assets/logo_(1)_1775576288927.webp";

/* ─── Color tokens ─── */
const G = "#01411C";       // Pakistan institutional green
const GA = "#16a34a";      // light accent green
const Y = "#EAB308";       // yellow accent
const YL = "#FEF9C3";      // yellow light
const CREAM = "#FDFBF4";   // hero cream background
const DARK = "#0a1f0f";    // dark footer green

/* ─── Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
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

/* ─── Scroll reveal ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-3">
      <span className="h-1 w-6 rounded-full" style={{ background: Y }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: G }}>{children}</span>
      <span className="h-1 w-6 rounded-full" style={{ background: Y }} />
    </div>
  );
}

/* ─── Program icons ─── */
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

/* ─── Decorative dot grid ─── */
function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className}`} aria-hidden>
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} className="inline-block m-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "rgba(1,65,28,0.18)" }} />
      ))}
    </div>
  );
}

/* ─── Yellow star decoration ─── */
function Star4({ size = 24, color = Y, className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
    </svg>
  );
}

export default function Home() {
  const { data: notices } = useListNotices({ active: "true" } as any);
  const { data: programs } = useListPrograms();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const fn = () => { setScrolled(window.scrollY > 20); };
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
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`px-4 sm:px-6 lg:px-16 py-3 flex items-center justify-between fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-sm border-b border-slate-200/80" : "bg-white border-b border-slate-200/40"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <img src={nmuLogo} alt="NMU Logo" className="h-9 w-9 object-contain" />
          <div>
            <span className="font-extrabold text-[13px] tracking-tight block leading-tight" style={{ color: G }}>AHS Portal</span>
            <span className="text-[10px] text-slate-500 leading-tight block">Nishtar Medical University</span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium">
          {[["Programs", "#programs"], ["How to Apply", "#how-to-apply"], ["Notices", "#notices"], ["FAQ", "#faq"]].map(([label, href]) => (
            <a key={label} href={href} className="text-slate-600 hover:text-[#01411C] transition-colors">
              {label}
            </a>
          ))}
          <Link href="/merit-search">
            <span className="text-slate-600 hover:text-[#01411C] transition-colors cursor-pointer">Merit Search</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <a href="tel:+926-61-9200174" className="hidden lg:flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
            <Phone className="h-3.5 w-3.5" style={{ color: G }} />
            061-920-0174
          </a>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-[13px] font-medium text-slate-700">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="text-[12px] sm:text-[13px] font-semibold px-3 sm:px-5 rounded-lg text-white" style={{ background: G }}>
              Apply Now
            </Button>
          </Link>
          {/* Hamburger – mobile only */}
          <button
            className="lg:hidden ml-1 p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-[56px] inset-x-0 z-40 bg-white border-b border-slate-200 shadow-lg lg:hidden"
        >
          <nav className="flex flex-col px-4 py-4 gap-1">
            {[["Programs", "#programs"], ["How to Apply", "#how-to-apply"], ["Notices", "#notices"], ["FAQ", "#faq"], ["Merit Search", "/merit-search"]].map(([label, href]) => (
              href.startsWith("#") ? (
                <a key={label} href={href} onClick={closeMobile} className="px-3 py-2.5 rounded-lg text-[14px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#01411C] transition-colors">
                  {label}
                </a>
              ) : (
                <Link key={label} href={href}>
                  <span onClick={closeMobile} className="block px-3 py-2.5 rounded-lg text-[14px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#01411C] transition-colors cursor-pointer">
                    {label}
                  </span>
                </Link>
              )
            ))}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login"><Button onClick={closeMobile} variant="outline" className="w-full justify-center text-[13px]">Sign In</Button></Link>
              <Link href="/register"><Button onClick={closeMobile} className="w-full justify-center text-[13px] text-white" style={{ background: G }}>Apply Now</Button></Link>
            </div>
          </nav>
        </motion.div>
      )}

      <main className="flex-1 pt-16">

        {/* ══════ HERO ══════ */}
        <section className="relative overflow-hidden" style={{ background: CREAM }}>
          {/* decorative dots — staggered fade-in */}
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
            className="absolute top-10 left-6 grid grid-cols-5 gap-2 pointer-events-none hidden sm:grid" aria-hidden
          >
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.span
                key={i}
                variants={{ hidden: { opacity: 0, scale: 0 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4 } } }}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "rgba(1,65,28,0.14)" }}
              />
            ))}
          </motion.div>

          {/* Animated spinning stars */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-16 right-[44%] hidden lg:block"
          >
            <Star4 size={28} className="opacity-60" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute top-32 right-[42%] hidden lg:block"
          >
            <Star4 size={18} className="opacity-35" />
          </motion.div>

          {/* ── DESKTOP: side-by-side ── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 hidden lg:grid lg:grid-cols-2 min-h-[82vh] items-center gap-0">

            {/* LEFT — copy */}
            <motion.div initial="hidden" animate="show" variants={stagger} className="py-10 lg:py-0 lg:pr-12 flex flex-col z-10">

              {/* Badge — bounces in */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } } }}
                className="mb-5"
              >
                <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold border" style={{ background: YL, color: "#854D0E", borderColor: "#FDE68A" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: Y }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: Y }} />
                  </span>
                  Admissions Open — Session 2025–26
                </span>
              </motion.div>

              {/* Headline — line by line */}
              <div className="mb-4 text-[2.4rem] xl:text-[2.8rem] font-black tracking-tight leading-[1.1] text-slate-900">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  Begin Your Career
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ color: G }}
                >
                  in Allied Health
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.41, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  Sciences
                </motion.div>
              </div>

              <motion.p variants={fadeUp} className="text-[14px] text-slate-500 leading-relaxed mb-7 max-w-[420px]">
                Official admissions portal for Allied Health College, Nishtar Medical University, Multan — the premier institution for Allied Health Sciences in southern Punjab.
              </motion.p>

              {/* Buttons — slide up with spring */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.55 }}
                className="flex flex-row gap-3 mb-7"
              >
                <Link href="/register">
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Button size="default" className="h-11 px-7 text-[14px] font-semibold gap-2 rounded-xl text-white shadow-md" style={{ background: G, boxShadow: "0 6px 20px rgba(1,65,28,0.28)" }}>
                      Start Application <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/merit-search">
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Button size="default" variant="outline" className="h-11 px-7 text-[14px] font-semibold gap-2 rounded-xl border-slate-300">
                      <Search className="h-4 w-4" /> Merit Status
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Pill tags — pop in */}
              <motion.div
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.65 } } }}
                className="flex flex-wrap gap-2"
              >
                {[
                  { icon: GraduationCap, label: "8 BSc Programs" },
                  { icon: Shield, label: "HEC Recognized" },
                  { icon: Star, label: "NMU Affiliated" },
                  { icon: Zap, label: "Merit-Based" },
                ].map(({ icon: Icon, label }) => (
                  <motion.div
                    key={label}
                    variants={{ hidden: { opacity: 0, scale: 0.7 }, show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 18 } } }}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600"
                  >
                    <Icon className="h-3 w-3" style={{ color: G }} />
                    {label}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* RIGHT — university photo panel */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative flex items-end justify-end h-full min-h-[82vh]"
            >
              <div className="absolute inset-0 rounded-bl-[64px]" style={{ background: `linear-gradient(160deg, ${G} 0%, ${GA} 100%)` }} />

              {/* Subtle zoom-breathe on campus photo */}
              <div className="relative w-full h-full rounded-bl-[64px] overflow-hidden">
                <motion.img
                  src={universityPhoto}
                  alt="NMU Campus"
                  className="w-full h-full object-cover object-center"
                  style={{ mixBlendMode: "luminosity", opacity: 0.55 }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(1,65,28,0.20) 0%, rgba(1,65,28,0.55) 100%)` }} />
              </div>

              {/* Floating left stat cards — staggered float */}
              <div className="absolute bottom-8 left-[-24px] flex flex-col gap-3">
                {[
                  { label: "Programs", value: 8, suffix: "", floatDelay: 0 },
                  { label: "Seats Available", value: 320, suffix: "", floatDelay: 0.8 },
                ].map(({ label, value, suffix, floatDelay }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.65, delay: 0.6 + floatDelay * 0.2 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 3.5 + floatDelay, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
                      className="bg-white rounded-xl px-4 py-3 shadow-xl flex items-center gap-3"
                      style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }}
                    >
                      <p className="text-2xl font-black" style={{ color: G }}><AnimatedCounter to={value} suffix={suffix} /></p>
                      <p className="text-[11px] font-semibold text-slate-500 leading-tight max-w-[60px]">{label}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Students Enrolled badge — floats down */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.8 }}
                className="absolute top-7 right-6"
              >
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white rounded-xl px-4 py-3 shadow-xl"
                  style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }}
                >
                  <p className="text-[11px] font-bold text-slate-500 mb-0.5">Students Enrolled</p>
                  <p className="text-xl font-black" style={{ color: G }}><AnimatedCounter to={1200} suffix="+" /></p>
                </motion.div>
              </motion.div>

              {/* Stars on panel — spinning */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                className="absolute top-14 left-6"
              >
                <Star4 size={24} className="opacity-80" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                className="absolute top-24 left-12"
              >
                <Star4 size={16} className="opacity-50" />
              </motion.div>
            </motion.div>
          </div>

          {/* ── MOBILE: stacked layout ── */}
          <div className="lg:hidden">
            {/* Mobile copy */}
            <motion.div initial="hidden" animate="show" variants={stagger} className="px-4 sm:px-6 pt-7 pb-6 flex flex-col">
              <motion.div variants={fadeUp} className="mb-4">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold border" style={{ background: YL, color: "#854D0E", borderColor: "#FDE68A" }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: Y }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: Y }} />
                  </span>
                  Admissions Open — Session 2025–26
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-[2rem] sm:text-[2.3rem] font-black tracking-tight leading-[1.12] mb-3 text-slate-900">
                Begin Your Career<br />
                <span style={{ color: G }}>in Allied Health</span><br />
                Sciences
              </motion.h1>

              <motion.p variants={fadeUp} className="text-[13px] text-slate-500 leading-relaxed mb-5">
                Official admissions portal for Allied Health College, Nishtar Medical University, Multan.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2.5 mb-5">
                <Link href="/register">
                  <Button className="w-full sm:w-auto h-11 px-6 text-[14px] font-semibold gap-2 rounded-xl text-white" style={{ background: G }}>
                    Start Application <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/merit-search">
                  <Button variant="outline" className="w-full sm:w-auto h-11 px-6 text-[14px] font-semibold gap-2 rounded-xl border-slate-300">
                    <Search className="h-4 w-4" /> Merit Status
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={stagger} className="flex flex-wrap gap-2">
                {[{ icon: GraduationCap, label: "8 BSc Programs" }, { icon: Shield, label: "HEC Recognized" }, { icon: Star, label: "NMU Affiliated" }].map(({ icon: Icon, label }) => (
                  <motion.div key={label} variants={scaleIn} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600">
                    <Icon className="h-3 w-3" style={{ color: G }} />
                    {label}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ══════ STATS BAR ══════ */}
        <section style={{ background: G }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
            className="max-w-5xl mx-auto px-6 lg:px-16 py-5 flex flex-wrap items-center justify-center gap-0"
          >
            {[
              { icon: GraduationCap, label: "8 Programs", sub: "Allied Health Sciences" },
              { icon: Award, label: "320 Seats", sub: "Per Admission Session" },
              { icon: Shield, label: "HEC Recognized", sub: "Fully Accredited" },
              { icon: BookOpen, label: "Established 2022", sub: "Nishtar Medical University" },
            ].map(({ icon: Icon, label, sub }, i, arr) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="flex flex-col items-center text-center px-10 py-2"
                style={{ borderRight: i < arr.length - 2 ? "1px solid rgba(255,255,255,0.20)" : "none" }}
              >
                <Icon className="h-5 w-5 mb-1.5" style={{ color: Y }} />
                <p className="text-white font-bold text-[13px] leading-tight">{label}</p>
                <p className="text-white/50 text-[11px] leading-tight">{sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ══════ ABOUT STRIP ══════ */}
        <section className="py-20 px-6 lg:px-16 bg-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* left — image (hidden on mobile) */}
            <Reveal className="hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden h-[400px]">
                <img
                  src={universityPhoto}
                  alt="Nishtar Medical University"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(1,65,28,0.5) 0%, transparent 60%)` }} />
                {/* bottom label */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 bg-white/95 backdrop-blur rounded-xl px-4 py-3">
                  <img src={nmuLogo} alt="NMU" className="h-9 w-9 object-contain" />
                  <div>
                    <p className="font-bold text-[13px] leading-tight" style={{ color: G }}>Allied Health College</p>
                    <p className="text-[11px] text-slate-500">Nishtar Medical University, Multan</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* right — features */}
            <div>
              <Reveal>
                <SectionLabel>Why Choose Us</SectionLabel>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4 text-slate-900">
                  Admissions Focused<br />
                  <span style={{ color: G }}>on Your Future</span>
                </h2>
                <p className="text-slate-500 mb-8 text-[15px] leading-relaxed">
                  Allied Health College offers HEC-recognized BSc programs in eight cutting-edge allied health disciplines. Merit-based, transparent, and fully digital admissions.
                </p>
              </Reveal>

              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="space-y-4">
                {[
                  { icon: GraduationCap, title: "Merit-Based Selection", desc: "Fully transparent merit formula based on FSc and Matric marks. No discretionary seats." },
                  { icon: Shield, title: "HEC & PMC Recognized", desc: "All programs recognized by Higher Education Commission and relevant regulatory bodies." },
                  { icon: FileText, title: "100% Digital Process", desc: "Apply, track status, generate challans, and check merit lists entirely online." },
                  { icon: Award, title: "Special Quota Support", desc: "Dedicated seats for minorities, differently-abled applicants, and NMU employees' children." },
                ].map(({ icon: Icon, title, desc }) => (
                  <motion.div key={title} variants={fadeUp} className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(1,65,28,0.08)" }}>
                      <Icon className="h-5 w-5" style={{ color: G }} />
                    </div>
                    <div>
                      <p className="font-bold text-[14px] text-slate-900 mb-0.5">{title}</p>
                      <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════ PROGRAMS ══════ */}
        <section id="programs" className="py-20 px-6 lg:px-16" style={{ background: "#F8FAF8" }}>
          <div className="max-w-7xl mx-auto">
            <Reveal className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
              <div>
                <SectionLabel>Our Programs</SectionLabel>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  8 Allied Health<br />
                  <span style={{ color: G }}>Disciplines</span>
                </h2>
              </div>
              <p className="text-slate-500 text-[14px] max-w-xs leading-relaxed">
                Four-year HEC-recognized BSc degrees at Nishtar Medical University, Multan.
              </p>
            </Reveal>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {displayPrograms.map((program, i) => {
                const Icon = PROGRAM_ICONS[(program as any).code] ?? Microscope;
                return (
                  <motion.div
                    key={(program as any).code ?? i}
                    variants={scaleIn}
                    whileHover={{ y: -6, boxShadow: "0 16px 48px rgba(1,65,28,0.12)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-green-200 flex flex-col gap-4 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{ background: `rgba(1,65,28,0.08)` }}>
                      <Icon className="h-6 w-6" style={{ color: G }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[14px] text-slate-900 mb-1 leading-snug">{program.name}</h3>
                      <p className="text-xs font-bold font-mono mb-3" style={{ color: G }}>{(program as any).code}</p>
                      <div className="flex gap-2">
                        <span className="text-[11px] border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-500 font-medium">4 Years</span>
                        <span className="text-[11px] border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-500 font-medium">BSc</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: G }}>
                      Learn more <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ══════ HOW TO APPLY ══════ */}
        <section id="how-to-apply" className="py-20 px-6 lg:px-16 bg-white relative overflow-hidden">
          {/* background pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none" style={{ background: "rgba(1,65,28,0.02)" }} aria-hidden />
          <Star4 size={48} className="absolute right-16 top-20 opacity-20" />
          <Star4 size={28} className="absolute right-32 bottom-16 opacity-15" />

          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-14">
              <SectionLabel>Application Process</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4 text-slate-900">
                Six Steps to <span style={{ color: G }}>Admission</span>
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto text-[15px] leading-relaxed">
                A simple, transparent process from registration to merit listing — done entirely online.
              </p>
            </Reveal>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="relative border border-slate-200 rounded-2xl p-6 bg-white hover:border-green-200 hover:shadow-lg transition-all duration-200"
                >
                  {/* step number watermark */}
                  <span className="absolute top-4 right-4 text-6xl font-black select-none leading-none" style={{ color: "rgba(1,65,28,0.06)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `linear-gradient(135deg, ${G}, ${GA})` }}>
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-[15px] text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <Reveal delay={0.3} className="text-center mt-10">
              <Link href="/register">
                <motion.div className="inline-block" whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-12 px-10 text-[15px] font-semibold gap-2 rounded-xl text-white shadow-lg" style={{ background: G, boxShadow: "0 8px 24px rgba(1,65,28,0.25)" }}>
                    Begin Your Application <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══════ ELIGIBILITY ══════ */}
        <section className="py-20 px-6 lg:px-16" style={{ background: "#F8FAF8" }}>
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-14">
              <SectionLabel>Eligibility</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4 text-slate-900">
                Admission <span style={{ color: G }}>Requirements</span>
              </h2>
            </Reveal>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={stagger}
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
                  className="bg-white border border-slate-200/80 rounded-2xl p-7 hover:shadow-md hover:border-green-200 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(1,65,28,0.08)" }}>
                      <Icon className="h-5 w-5" style={{ color: G }} />
                    </div>
                    <h3 className="font-bold text-[15px] text-slate-900">{title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {items.map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: GA }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════ NOTICES ══════ */}
        <section id="notices" className="py-20 px-6 lg:px-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
                <div>
                  <SectionLabel>Latest Updates</SectionLabel>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                    Important <span style={{ color: G }}>Notices</span>
                  </h2>
                </div>
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" className="gap-2 rounded-xl font-medium border-slate-300">
                      <Bell className="h-4 w-4" /> View All
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </Reveal>

            {activeNotices.length > 0 ? (
              <motion.div
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                variants={stagger}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {activeNotices.map(notice => (
                  <motion.div
                    key={notice.id}
                    variants={scaleIn}
                    whileHover={{ y: -5, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col hover:border-green-200 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${CAT_STYLES[notice.category] ?? CAT_STYLES.general}`}>
                        {notice.category}
                      </span>
                      <span className="text-xs text-slate-400">{notice.publishedAt ? format(new Date(notice.publishedAt), "dd MMM yyyy") : ""}</span>
                    </div>
                    <h3 className="font-bold text-[14px] text-slate-900 mb-2 leading-snug">{notice.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3 flex-1">{notice.content}</p>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Reveal>
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                  <Bell className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-400 font-medium">No notices published yet. Check back soon.</p>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* ══════ MERIT SEARCH CTA ══════ */}
        <section className="py-20 px-6 lg:px-16 relative overflow-hidden" style={{ background: G }}>
          <Star4 size={64} className="absolute right-20 top-8 opacity-15" />
          <Star4 size={36} className="absolute right-36 bottom-8 opacity-10" />
          <Star4 size={24} className="absolute left-16 top-1/2 -translate-y-1/2 opacity-10" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <Reveal>
              <SectionLabel>Merit Lists</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-5">
                Check Your Merit<br />
                <span style={{ color: Y }}>Status Instantly</span>
              </h2>
              <p className="text-white/65 text-[15px] leading-relaxed mb-8 max-w-xl mx-auto">
                Enter your CNIC to instantly check your merit position, application status, and verification schedule across all admission sessions.
              </p>
              <Link href="/merit-search">
                <motion.div className="inline-block" whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-13 px-10 text-[15px] font-bold gap-2 rounded-xl" style={{ background: Y, color: DARK, boxShadow: "0 8px 32px rgba(234,179,8,0.35)" }}>
                    <Search className="h-5 w-5" /> Search Merit List
                  </Button>
                </motion.div>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══════ FAQ ══════ */}
        <section id="faq" className="py-20 px-6 lg:px-16" style={{ background: "#F8FAF8" }}>
          <div className="max-w-3xl mx-auto">
            <Reveal className="text-center mb-14">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4 text-slate-900">
                Frequently Asked <span style={{ color: G }}>Questions</span>
              </h2>
            </Reveal>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ.map((item, i) => (
                <Reveal key={i} delay={i * 0.04}>
                  <AccordionItem
                    value={`faq-${i}`}
                    className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm"
                    style={{ borderLeft: `3px solid ${G}` }}
                  >
                    <AccordionTrigger className="px-6 py-4 text-[14px] font-semibold text-slate-900 hover:no-underline hover:text-[#01411C] text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-5 text-[13px] text-slate-500 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                </Reveal>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ══════ CONTACT ══════ */}
        <section className="py-20 px-6 lg:px-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-14">
              <SectionLabel>Contact</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Get in <span style={{ color: G }}>Touch</span>
              </h2>
            </Reveal>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={stagger}
              className="grid md:grid-cols-3 gap-5"
            >
              {[
                { icon: MapPin, title: "Address", lines: ["Allied Health College", "Nishtar Medical University, Multan"] },
                { icon: Phone, title: "Phone", lines: ["061-920-0174", "Mon–Fri: 8am – 2pm"] },
                { icon: Mail, title: "Email", lines: ["admissions@ahscollege.edu.pk", "info@ahscollege.edu.pk"] },
              ].map(({ icon: Icon, title, lines }) => (
                <motion.div
                  key={title}
                  variants={scaleIn}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="text-center bg-white border border-slate-200/80 rounded-2xl p-8 hover:shadow-md hover:border-green-200 transition-all duration-200"
                >
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(1,65,28,0.08)" }}>
                    <Icon className="h-6 w-6" style={{ color: G }} />
                  </div>
                  <h3 className="font-bold text-[15px] text-slate-900 mb-3">{title}</h3>
                  {lines.map(l => <p key={l} className="text-[13px] text-slate-500">{l}</p>)}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════ NEWSLETTER STRIP ══════ */}
        <section className="py-16 px-6 lg:px-16" style={{ background: DARK }}>
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <Star4 size={24} className="mb-3 opacity-60" />
              <h3 className="text-3xl font-black text-white leading-snug">
                Stay Informed on<br />
                <span style={{ color: Y }}>Admissions Updates</span>
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-[14px] font-bold gap-2 rounded-xl w-full sm:w-auto" style={{ background: Y, color: DARK }}>
                  <GraduationCap className="h-4 w-4" />
                  Create Student Account
                </Button>
              </Link>
              <Link href="/merit-search">
                <Button size="lg" variant="outline" className="h-12 px-8 text-[14px] font-semibold gap-2 rounded-xl border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                  <Search className="h-4 w-4" />
                  Merit Search
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: DARK }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-16 pt-14 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src={nmuLogo} alt="NMU Logo" className="h-11 w-11 object-contain" />
                <div>
                  <span className="font-extrabold text-[13px] block leading-tight text-white">Allied Health College</span>
                  <span className="text-[11px] text-white/40">Nishtar Medical University</span>
                </div>
              </div>
              <p className="text-white/40 text-[12px] leading-relaxed">
                Premier institution for Allied Health Sciences in southern Punjab, Pakistan.
              </p>
            </div>
            {/* links */}
            <div>
              <p className="text-white font-bold text-[13px] mb-4">Programs</p>
              <ul className="space-y-2">
                {["Medical Lab Technology", "Medical Imaging", "Renal Dialysis", "Optometry"].map(l => (
                  <li key={l}><a href="#programs" className="text-white/40 text-[12px] hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-bold text-[13px] mb-4">Quick Links</p>
              <ul className="space-y-2">
                {[["Merit Search", "/merit-search"], ["Apply Now", "/register"], ["Sign In", "/login"]].map(([l, h]) => (
                  <li key={l}><Link href={h}><span className="text-white/40 text-[12px] hover:text-white transition-colors cursor-pointer">{l}</span></Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-bold text-[13px] mb-4">Contact</p>
              <ul className="space-y-2 text-white/40 text-[12px]">
                <li>Allied Health College, NMU, Multan</li>
                <li>061-920-0174</li>
                <li>Mon–Fri: 8am – 2pm</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/30 text-[12px]">
              © {new Date().getFullYear()} Allied Health College, Nishtar Medical University. All rights reserved.
            </p>
            <div className="flex gap-5 text-[12px] text-white/30">
              <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
              <span className="cursor-pointer hover:text-white transition-colors">Terms of Use</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

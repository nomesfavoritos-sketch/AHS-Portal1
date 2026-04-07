import { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useInView, useMotionValue, useSpring, animate, stagger, AnimatePresence } from "framer-motion";
import { useListNotices, useListPrograms } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowRight, CheckCircle, FileText, CreditCard, ClipboardCheck, Award, Users,
  GraduationCap, Search, Bell, Phone, Mail, MapPin, Microscope, Eye, Heart,
  Activity, Smile, Bone, ChevronRight, Building2, Shield, Star, Zap, Globe,
  BookOpen, FlaskConical
} from "lucide-react";
import { format } from "date-fns";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const staggerFast = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const slideRight = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Counter Animation ─── */
function AnimatedCounter({ to, suffix = "", duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !nodeRef.current) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        if (nodeRef.current) nodeRef.current.textContent = Math.round(value).toLocaleString() + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, duration]);

  return (
    <span ref={ref}>
      <span ref={nodeRef}>0{suffix}</span>
    </span>
  );
}

/* ─── Section Wrapper with scroll animation ─── */
function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{ hidden: { opacity: 0, y: 50 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] } } }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Program Icons Map ─── */
const PROGRAM_ICONS: Record<string, React.ElementType> = {
  BSMLT: Microscope,
  BSMIT: Eye,
  BSRDT: Activity,
  BSOOT: Globe,
  BSANT: Heart,
  BSEND: FlaskConical,
  BSDNT: Smile,
  BSOPT: Bone,
};

const FALLBACK_PROGRAMS = [
  { code: "BSMLT", name: "Medical Lab Technology", duration: 4 },
  { code: "BSMIT", name: "Medical Imaging Technology", duration: 4 },
  { code: "BSRDT", name: "Renal Dialysis Technology", duration: 4 },
  { code: "BSOOT", name: "Optometry", duration: 4 },
  { code: "BSANT", name: "Anesthesia Technology", duration: 4 },
  { code: "BSEND", name: "Endoscopy Technology", duration: 4 },
  { code: "BSDNT", name: "Dental Technology", duration: 4 },
  { code: "BSOPT", name: "Orthotics & Prosthetics", duration: 4 },
];

const STEPS = [
  { icon: Users, title: "Create Account", desc: "Register with your CNIC and personal information.", color: "from-blue-500 to-blue-600" },
  { icon: FileText, title: "Complete Profile", desc: "Fill in your academic qualifications and documents.", color: "from-violet-500 to-violet-600" },
  { icon: GraduationCap, title: "Select Program", desc: "Choose from 8 specialised Allied Health programs.", color: "from-purple-500 to-purple-600" },
  { icon: CreditCard, title: "Pay Fee Challan", desc: "Deposit PKR 500 application fee at any HBL branch.", color: "from-teal-500 to-teal-600" },
  { icon: ClipboardCheck, title: "Submit Application", desc: "Upload your paid slip and submit the application.", color: "from-green-500 to-green-600" },
  { icon: Award, title: "Check Merit List", desc: "View rankings and confirm your joining intent.", color: "from-amber-500 to-amber-600" },
];

const FAQ = [
  { q: "What programs are offered at Allied Health College?", a: "We offer 8 Allied Health Sciences programs: Medical Lab Technology (BSMLT), Medical Imaging Technology (BSMIT), Renal Dialysis Technology (BSRDT), Optometry (BSOOT), Anesthesia Technology (BSANT), Endoscopy Technology (BSEND), Dental Technology (BSDNT), and Orthotics & Prosthetics (BSOPT). All programs are 4-year BSc degrees affiliated with Nishtar Medical University." },
  { q: "What is the minimum eligibility to apply?", a: "Applicants must have passed FSc (Pre-Medical) with at least 50% marks from an HEC-recognized board. A valid Domicile from Punjab province is required. CNIC/B-Form is mandatory for registration." },
  { q: "How is the merit calculated?", a: "Merit is calculated as: Merit% = ((Matric Marks / Matric Total × 10) + (FSc Marks / FSc Total × 70)) / 80 × 100. FSc marks carry the highest weightage at 70%." },
  { q: "What documents are required?", a: "Matric Certificate & Marksheet, FSc Certificate & Marksheet, Domicile Certificate, CNIC/B-Form (original + copy), Passport Photo, Character Certificate, and Medical Fitness Certificate." },
  { q: "How do I pay the application fee?", a: "Generate your challan from the portal, deposit at any HBL branch, then upload the bank-stamped paid slip in the portal to proceed." },
  { q: "When are merit lists published?", a: "Merit lists are published after the admission window closes and all applications are reviewed. You will receive a portal notification and can use Merit Search to check your status." },
  { q: "What happens after being selected for verification?", a: "Report to the Verification Desk at Allied Health College with all original documents during working hours: Monday–Friday, 8am–2pm." },
  { q: "Can I apply under a quota category?", a: "Yes — we offer Special Quotas for minorities, students with disabilities, and children of NMU employees. Select your category during the application and provide supporting documentation." },
];

/* ─── Notice Category Badge ─── */
const CAT_STYLES: Record<string, string> = {
  general: "bg-slate-100/80 text-slate-700 border-slate-200",
  admission: "bg-blue-50/80 text-blue-700 border-blue-200",
  merit: "bg-purple-50/80 text-purple-700 border-purple-200",
  payment: "bg-amber-50/80 text-amber-700 border-amber-200",
  urgent: "bg-red-50/80 text-red-700 border-red-200 font-semibold",
};

/* ─── Floating Orb ─── */
function Orb({ x, y, size, color, delay = 0, duration = 8 }: { x: string; y: string; size: number; color: string; delay?: number; duration?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: "blur(60px)", opacity: 0.35 }}
      animate={{ y: [0, -30, 0], scale: [1, 1.1, 1], opacity: [0.3, 0.45, 0.3] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─── Main Component ─── */
export default function Home() {
  const { data: notices } = useListNotices({ active: "true" } as any);
  const { data: programs } = useListPrograms();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeNotices = (notices ?? []).filter(n => n.isActive).slice(0, 6);
  const displayPrograms = (programs ?? []).filter(p => p.isActive).length > 0
    ? (programs ?? []).filter(p => p.isActive)
    : FALLBACK_PROGRAMS;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc] text-foreground overflow-x-hidden">

      {/* ── STICKY HEADER ── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`px-6 lg:px-10 py-3 flex items-center justify-between fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-xl shadow-md border-b border-white/60" : "bg-transparent"
        }`}
      >
        <motion.div className="flex items-center gap-2.5" whileHover={{ scale: 1.02 }}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block leading-tight text-foreground">AHS Portal</span>
            <span className="text-[10px] text-muted-foreground leading-tight block">Nishtar Medical University</span>
          </div>
        </motion.div>

        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium">
          {["Programs", "How to Apply", "Notices", "FAQ"].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="text-muted-foreground hover:text-foreground transition-colors relative group"
              whileHover={{ y: -1 }}
            >
              {item}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-200" />
            </motion.a>
          ))}
          <Link href="/merit-search">
            <motion.span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative group" whileHover={{ y: -1 }}>
              Merit Search
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-200" />
            </motion.span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="ghost" size="sm" className="font-medium text-[13px]">Sign in</Button>
            </motion.div>
          </Link>
          <Link href="/register">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/25 font-medium text-[13px] px-5">
                Apply Now
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 pt-16">

        {/* ══════ HERO ══════ */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#0d1433] to-[#111827]">
          {/* Animated orbs */}
          <Orb x="5%" y="10%" size={500} color="radial-gradient(circle, #3b82f680, #1d4ed840)" delay={0} duration={10} />
          <Orb x="60%" y="5%" size={400} color="radial-gradient(circle, #8b5cf650, #6d28d930)" delay={2} duration={12} />
          <Orb x="75%" y="55%" size={350} color="radial-gradient(circle, #06b6d440, #0891b220)" delay={4} duration={9} />
          <Orb x="20%" y="65%" size={300} color="radial-gradient(circle, #a855f740, #7c3aed20)" delay={1} duration={11} />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

          {/* Radial vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] via-transparent to-transparent opacity-60" />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: Text */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={staggerContainer}
              >
                {/* Animated badge */}
                <motion.div variants={fadeUp} className="mb-8">
                  <motion.span
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-white/80"
                    animate={{ boxShadow: ["0 0 0 0 rgba(99,102,241,0)", "0 0 0 8px rgba(99,102,241,0.1)", "0 0 0 0 rgba(99,102,241,0)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    Admissions Open — Allied Health College, NMU
                  </motion.span>
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6">
                  Begin Your Career
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400">
                    in Allied Health
                  </span>
                  <br />
                  Sciences
                </motion.h1>

                <motion.p variants={fadeUp} className="text-lg text-white/60 leading-relaxed mb-10 max-w-lg">
                  The official admissions portal for Allied Health College, Nishtar Medical University, Multan. Apply for BSc programs, track merit status, and manage your admission journey.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="h-13 px-8 text-base bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-xl shadow-blue-900/40 font-semibold gap-2 rounded-xl">
                        Start Application <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/merit-search">
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button size="lg" variant="outline" className="h-13 px-8 text-base border-white/20 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm font-semibold gap-2 rounded-xl">
                        <Search className="h-4 w-4" /> Check Merit Status
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>

                {/* Feature pills */}
                <motion.div variants={staggerFast} className="flex flex-wrap gap-3">
                  {[
                    { icon: GraduationCap, label: "8 BSc Programs" },
                    { icon: Shield, label: "NMU Affiliated" },
                    { icon: Star, label: "Merit-Based" },
                    { icon: Zap, label: "Instant Results" },
                  ].map(({ icon: Icon, label }) => (
                    <motion.div
                      key={label}
                      variants={scaleIn}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-3.5 py-1.5 text-xs text-white/70 font-medium"
                    >
                      <Icon className="h-3.5 w-3.5 text-blue-400" />
                      {label}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right: Animated Stats Cards */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={staggerContainer}
                className="hidden lg:grid grid-cols-2 gap-4"
              >
                {[
                  { label: "Programs Offered", value: 8, suffix: "", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", text: "text-blue-300", icon: GraduationCap },
                  { label: "Years of Excellence", value: 15, suffix: "+", color: "from-violet-500/20 to-violet-600/10", border: "border-violet-500/20", text: "text-violet-300", icon: Star },
                  { label: "Students Enrolled", value: 1200, suffix: "+", color: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/20", text: "text-cyan-300", icon: Users },
                  { label: "Seats Available", value: 320, suffix: "", color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20", text: "text-emerald-300", icon: Award },
                ].map(({ label, value, suffix, color, border, text, icon: Icon }, i) => (
                  <motion.div
                    key={label}
                    variants={scaleIn}
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`rounded-2xl border ${border} bg-gradient-to-br ${color} backdrop-blur-sm p-6 flex flex-col gap-3`}
                  >
                    <div className={`h-10 w-10 rounded-xl bg-white/5 border ${border} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${text}`} />
                    </div>
                    <p className={`text-4xl font-black ${text}`}>
                      <AnimatedCounter to={value} suffix={suffix} />
                    </p>
                    <p className="text-white/50 text-xs font-medium leading-snug">{label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-white/30 text-xs font-medium tracking-widest uppercase">Scroll</span>
              <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* ══════ STATS STRIP ══════ */}
        <section className="bg-white border-y border-slate-100">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { label: "Allied Health Programs", value: 8, suffix: "", color: "text-primary" },
              { label: "Total Seats Available", value: 320, suffix: "", color: "text-violet-600" },
              { label: "Years Established", value: 2009, suffix: "", color: "text-cyan-600" },
              { label: "Success Rate", value: 94, suffix: "%", color: "text-emerald-600" },
            ].map(({ label, value, suffix, color }) => (
              <motion.div key={label} variants={scaleIn} className="text-center">
                <p className={`text-4xl font-black ${color}`}>
                  <AnimatedCounter to={value} suffix={suffix} />
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ══════ PROGRAMS ══════ */}
        <Section id="programs" className="py-24 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.p variants={fadeUp} className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Our Programs</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                8 Specialised Allied<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-600 to-cyan-500">Health Disciplines</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
                Four-year BSc programs designed by practitioners to train the next generation of healthcare professionals.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {displayPrograms.map((program, i) => {
                const Icon = PROGRAM_ICONS[(program as any).code] ?? Microscope;
                const gradients = [
                  "from-blue-50 to-blue-100/60 border-blue-200/60 hover:border-blue-300",
                  "from-violet-50 to-violet-100/60 border-violet-200/60 hover:border-violet-300",
                  "from-cyan-50 to-cyan-100/60 border-cyan-200/60 hover:border-cyan-300",
                  "from-emerald-50 to-emerald-100/60 border-emerald-200/60 hover:border-emerald-300",
                  "from-purple-50 to-purple-100/60 border-purple-200/60 hover:border-purple-300",
                  "from-teal-50 to-teal-100/60 border-teal-200/60 hover:border-teal-300",
                  "from-rose-50 to-rose-100/60 border-rose-200/60 hover:border-rose-300",
                  "from-amber-50 to-amber-100/60 border-amber-200/60 hover:border-amber-300",
                ];
                const iconColors = ["text-blue-600", "text-violet-600", "text-cyan-600", "text-emerald-600", "text-purple-600", "text-teal-600", "text-rose-600", "text-amber-600"];
                const iconBgs = ["bg-blue-100", "bg-violet-100", "bg-cyan-100", "bg-emerald-100", "bg-purple-100", "bg-teal-100", "bg-rose-100", "bg-amber-100"];
                const g = gradients[i % gradients.length];
                const ic = iconColors[i % iconColors.length];
                const ib = iconBgs[i % iconBgs.length];
                return (
                  <motion.div
                    key={(program as any).code ?? program.id ?? i}
                    variants={scaleIn}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`bg-gradient-to-br ${g} border rounded-2xl p-6 flex flex-col gap-4 cursor-default transition-colors duration-200 shadow-sm hover:shadow-md`}
                  >
                    <div className={`h-12 w-12 rounded-xl ${ib} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${ic}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px] text-foreground mb-1 leading-tight">{program.name}</h3>
                      <p className={`text-xs font-mono font-bold ${ic} mb-2`}>{(program as any).code}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/60 border border-white/80 rounded-full px-2.5 py-0.5 text-muted-foreground font-medium">4 Years</span>
                        <span className="text-xs bg-white/60 border border-white/80 rounded-full px-2.5 py-0.5 text-muted-foreground font-medium">BSc</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </Section>

        {/* ══════ HOW TO APPLY ══════ */}
        <section id="how-to-apply" className="py-24 px-6 lg:px-10 bg-gradient-to-br from-[#0a0e27] via-[#0d1433] to-[#111827] relative overflow-hidden">
          <Orb x="80%" y="20%" size={400} color="radial-gradient(circle, #3b82f640, #1d4ed820)" duration={10} />
          <Orb x="10%" y="60%" size={350} color="radial-gradient(circle, #8b5cf640, #6d28d920)" delay={3} duration={12} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.p variants={fadeUp} className="text-blue-400 font-semibold text-sm uppercase tracking-widest mb-3">Application Process</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Six Simple Steps to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Admission</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-white/50 max-w-lg mx-auto text-base">
                Follow these steps to complete your application from registration through to merit listing.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-4xl font-black text-white/10 select-none">0{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-center mt-12"
            >
              <Link href="/register">
                <motion.div className="inline-block" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-13 px-10 text-base bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-xl shadow-blue-900/40 font-semibold gap-2 rounded-xl">
                    Begin Your Application <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ══════ ELIGIBILITY ══════ */}
        <Section className="py-24 px-6 lg:px-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.p variants={fadeUp} className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Eligibility</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Are You <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600">Eligible?</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto text-base">
                Check the requirements before starting your application.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-6"
            >
              {[
                { title: "Academic Requirement", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", items: ["FSc (Pre-Medical) with minimum 50% marks", "Matric (Science subjects) with minimum 50% marks", "Degree from HEC-recognized institution"] },
                { title: "Documentation Required", icon: FileText, color: "text-violet-600", bg: "bg-violet-50", items: ["Valid CNIC or B-Form (Pakistani national)", "Domicile Certificate from Punjab province", "Medical Fitness Certificate from authorized doctor"] },
                { title: "Other Requirements", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", items: ["Character Certificate from last institution", "Passport-size photographs (recent, plain background)", "Compliance with joining deadline after selection"] },
                { title: "Special Quota Eligibility", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", items: ["Minority quota: Non-Muslim candidates with valid certificate", "Disability quota: Certificate from authorized authority", "NMU Employee quota: Valid employment proof of parent"] },
              ].map(({ title, icon: Icon, color, bg, items }) => (
                <motion.div
                  key={title}
                  variants={scaleIn}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-[#f8f9fc] border border-slate-200 rounded-2xl p-7 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <h3 className="font-bold text-[15px]">{title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {items.map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ══════ NOTICES ══════ */}
        <Section id="notices" className="py-24 px-6 lg:px-10 bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 gap-4"
            >
              <div>
                <motion.p variants={fadeUp} className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Latest Updates</motion.p>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight">
                  Important <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600">Notices</span>
                </motion.h2>
              </div>
              <motion.div variants={fadeUp}>
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" className="gap-2 rounded-xl font-medium">
                      <Bell className="h-4 w-4" /> View All Notices
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>

            {activeNotices.length > 0 ? (
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
              >
                {activeNotices.map((notice) => (
                  <motion.div
                    key={notice.id}
                    variants={scaleIn}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${CAT_STYLES[notice.category] ?? CAT_STYLES.general}`}>
                        {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {notice.publishedAt ? format(new Date(notice.publishedAt), "MMM d, yyyy") : format(new Date(notice.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-bold text-[15px] mb-2 leading-snug">{notice.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">{notice.content}</p>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center py-16 text-muted-foreground border-2 border-dashed border-slate-200 rounded-2xl bg-white"
              >
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No active notices at this time.</p>
                <p className="text-sm mt-1">Check back soon for updates.</p>
              </motion.div>
            )}
          </div>
        </Section>

        {/* ══════ MERIT SEARCH CTA ══════ */}
        <section className="py-6 px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-r from-primary via-primary/95 to-violet-700 px-10 py-16 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden relative shadow-2xl shadow-primary/30"
          >
            <Orb x="70%" y="-20%" size={300} color="radial-gradient(circle, #ffffff20, transparent)" duration={8} />
            <div className="relative text-center lg:text-left">
              <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-2">Merit Search</p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Check Your Merit Status</h2>
              <p className="text-white/70 text-base max-w-md">
                Search by CNIC or Application Number to instantly view your merit ranking and position.
              </p>
            </div>
            <Link href="/merit-search">
              <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="secondary" className="h-13 px-10 text-base font-bold gap-2 rounded-xl shadow-xl whitespace-nowrap">
                  <Search className="h-5 w-5" /> Search Merit List
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </section>

        {/* ══════ FAQ ══════ */}
        <Section id="faq" className="py-24 px-6 lg:px-10 bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-14"
            >
              <motion.p variants={fadeUp} className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">FAQ</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600">Questions</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto">
                Everything you need to know about the admission process.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ.map((item, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <AccordionItem value={`item-${i}`} className="border border-slate-200 rounded-2xl px-6 bg-[#f8f9fc] hover:bg-white transition-colors duration-200 hover:border-slate-300 hover:shadow-sm">
                      <AccordionTrigger className="text-left font-semibold text-[15px] py-5 hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </Section>

        {/* ══════ CONTACT ══════ */}
        <Section className="py-24 px-6 lg:px-10 bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-14"
            >
              <motion.p variants={fadeUp} className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Get in Touch</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight">
                Contact the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600">Admissions Office</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {[
                { icon: Phone, title: "Phone", lines: ["+92-61-XXXXXXX", "Mon–Fri, 8am–2pm"], color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
                { icon: Mail, title: "Email", lines: ["admissions@ahscollege.edu.pk", "Reply within 48 hours"], color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-100" },
                { icon: MapPin, title: "Address", lines: ["Allied Health College", "Nishtar Medical University, Multan"], color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
              ].map(({ icon: Icon, title, lines, color, bg, ring }) => (
                <motion.div
                  key={title}
                  variants={scaleIn}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className={`h-14 w-14 rounded-2xl ${bg} ring-4 ${ring} flex items-center justify-center mx-auto mb-5`}>
                    <Icon className={`h-7 w-7 ${color}`} />
                  </div>
                  <h3 className="font-bold text-base mb-3">{title}</h3>
                  {lines.map(l => <p key={l} className="text-sm text-muted-foreground leading-relaxed">{l}</p>)}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ══════ FINAL CTA ══════ */}
        <section className="py-24 px-6 lg:px-10 bg-white border-t border-slate-100">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.p variants={fadeUp} className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Apply Today</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight mb-5">
              Your Journey Begins <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-600 to-cyan-500">Right Here</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-base mb-10 leading-relaxed">
              Create your account today and take the first step towards a rewarding career in Allied Health Sciences at Nishtar Medical University.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-13 px-12 text-base bg-gradient-to-r from-primary to-violet-600 border-0 shadow-xl shadow-primary/25 font-bold gap-2 rounded-xl">
                    Create Account <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="outline" className="h-13 px-12 text-base font-bold rounded-xl border-slate-300">
                    Sign In to Portal
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-slate-200 bg-[#f8f9fc] py-10 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm block leading-tight">Allied Health College</span>
              <span className="text-xs text-muted-foreground">Nishtar Medical University, Multan</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Allied Health College, Nishtar Medical University. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs font-medium text-muted-foreground">
            <Link href="/merit-search"><span className="hover:text-foreground cursor-pointer transition-colors">Merit Search</span></Link>
            <Link href="/login"><span className="hover:text-foreground cursor-pointer transition-colors">Sign In</span></Link>
            <Link href="/register"><span className="hover:text-foreground cursor-pointer transition-colors">Apply Now</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

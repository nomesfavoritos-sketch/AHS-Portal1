import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { TopHeader } from "./top-header";
import {
  LayoutDashboard, User, FileText,
  FileUp, Menu, X, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_BG = "#013220";
const ACTIVE_BG = "rgba(22,163,74,0.22)";
const ACTIVE_BORDER = "#16A34A";
const HOVER_BG = "rgba(255,255,255,0.06)";

interface StudentLayoutProps { children: ReactNode; }

const NAV_GROUPS = [
  {
    label: "ADMISSIONS",
    items: [
      { name: "Dashboard",    href: "/student/dashboard",    icon: LayoutDashboard, sub: "Overview & Metrics" },
      { name: "My Profile",   href: "/student/profile",      icon: User,            sub: "Personal Information" },
      { name: "Documents",    href: "/student/documents",    icon: FileUp,          sub: "Upload Documents" },
      { name: "Applications", href: "/student/applications", icon: FileText,        sub: "Program Applications" },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full select-none" style={{ background: SIDEBAR_BG }}>

      {/* Logo */}
      <div className="px-5 py-5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <img
            src={import.meta.env.BASE_URL + "logo.webp"}
            alt="AHS Logo"
            className="h-10 w-10 rounded-xl object-contain shrink-0 bg-white p-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-[15px] leading-tight">Allied Health Sciences</p>
            <p className="text-[12px] leading-tight" style={{ color: "rgba(255,255,255,0.50)" }}>
              Student Portal · NMU
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/50 hover:text-white ml-1 shrink-0">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Session badge */}
        <div
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.25)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] font-semibold" style={{ color: "#4ade80" }}>
            Admissions 2025–26 Open
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href} onClick={onClose}>
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group"
                      style={{
                        background: isActive ? ACTIVE_BG : "transparent",
                        borderLeft: isActive ? `3px solid ${ACTIVE_BORDER}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isActive ? "rgba(22,163,74,0.30)" : "rgba(255,255,255,0.07)",
                        }}
                      >
                        <item.icon
                          className="h-4 w-4"
                          style={{ color: isActive ? "#4ade80" : "rgba(255,255,255,0.50)" }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[13px] font-semibold leading-tight"
                          style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)" }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-[11px] leading-tight truncate"
                          style={{ color: isActive ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.30)" }}
                        >
                          {item.sub}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#4ade80" }} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            System Online
          </span>
          <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            AHS-NMU
          </span>
        </div>
      </div>
    </div>
  );
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">

      {/* Desktop Sidebar */}
      <aside className="w-60 h-full shrink-0 hidden md:block" style={{ boxShadow: "2px 0 20px rgba(1,50,32,0.15)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-60 h-full" style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.3)" }}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center h-12 px-4 gap-3 shrink-0"
          style={{ background: "#013220", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <img
            src={import.meta.env.BASE_URL + "logo.webp"}
            alt="AHS Logo"
            className="h-6 w-6 rounded-md object-contain bg-white p-px"
          />
          <span className="text-sm font-bold text-white">Student Portal</span>
        </div>

        <TopHeader />

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

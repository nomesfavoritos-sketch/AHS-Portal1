import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { TopHeader } from "./top-header";
import {
  LayoutDashboard, User, FileText, CreditCard,
  FileUp, Award, Bell, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const G = "#01411C";

interface StudentLayoutProps { children: ReactNode; }

const NAV_GROUPS = [
  {
    label: "ADMISSIONS",
    items: [
      { name: "Dashboard",    href: "/student/dashboard",    icon: LayoutDashboard, sub: "Overview & Metrics" },
      { name: "My Profile",   href: "/student/profile",      icon: User,            sub: "Personal Information" },
      { name: "Applications", href: "/student/applications", icon: FileText,        sub: "Program Applications" },
      { name: "Fee Challans", href: "/student/challans",     icon: CreditCard,      sub: "Payment History" },
    ],
  },
  {
    label: "ACADEMIC",
    items: [
      { name: "Merit Status", href: "/student/merit",        icon: Award,           sub: "Merit List Position" },
      { name: "Documents",    href: "/student/documents",    icon: FileUp,          sub: "Upload Documents" },
    ],
  },
  {
    label: "INFO",
    items: [
      { name: "Notices",      href: "/student/notices",      icon: Bell,            sub: "Announcements" },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full bg-white border-r select-none">
      {/* Logo */}
      <div className="px-4 py-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: G }}
          >
            <span className="text-white font-black text-sm tracking-tight">AHS</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">Allied Health Sciences</p>
            <p className="text-[11px] text-gray-400 leading-tight">NMU · Student Portal v1.0</p>
          </div>
        </div>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1 text-[10px] font-bold text-gray-400 tracking-widest uppercase">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href} onClick={onClose}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group",
                        isActive ? "text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      style={isActive ? { background: G } : {}}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-green-200" : "text-gray-400 group-hover:text-gray-600")} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold leading-tight", isActive ? "text-white" : "")}>{item.name}</p>
                        <p className={cn("text-[11px] leading-tight truncate", isActive ? "text-green-200" : "text-gray-400")}>{item.sub}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div className="px-4 py-3 border-t bg-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500 font-medium">System Online</span>
          <span className="ml-auto text-[10px] text-gray-400">AHS-NMU</span>
        </div>
      </div>
    </div>
  );
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    /* Full-screen app shell — no gaps */
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "#f5f6fa" }}>

      {/* ── Desktop Sidebar (fixed height, no scroll on page) ── */}
      <aside className="w-60 h-full shrink-0 hidden md:block">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay sidebar ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-60 h-full">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* ── Right panel: header + scrollable content ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-12 px-4 bg-white border-b gap-3 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600">
            <Menu className="h-5 w-5" />
          </button>
          <div className="h-6 w-6 rounded flex items-center justify-center" style={{ background: G }}>
            <span className="text-white text-[9px] font-black">AHS</span>
          </div>
          <span className="text-sm font-bold text-gray-800">Student Portal</span>
        </div>

        <TopHeader />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:px-5 md:py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";
import { TopHeader } from "./top-header";
import {
  LayoutDashboard, User, FileText, CreditCard,
  FileUp, Award, Bell, Menu, LogOut, Loader2,
  X, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentLayoutProps { children: ReactNode; }

const NAV_GROUPS = [
  {
    label: "ADMISSIONS",
    items: [
      { name: "Dashboard",    href: "/student/dashboard",    icon: LayoutDashboard, sub: "Overview & Metrics" },
      { name: "My Profile",   href: "/student/profile",      icon: User,            sub: "Personal Information" },
      { name: "Applications", href: "/student/applications", icon: FileText,        sub: "Program Applications" },
      { name: "Documents",    href: "/student/documents",    icon: FileUp,          sub: "Upload Documents" },
      { name: "Fee Challans", href: "/student/challans",     icon: CreditCard,      sub: "Payment History" },
    ],
  },
  {
    label: "ACADEMIC",
    items: [
      { name: "Merit Status", href: "/student/merit",        icon: Award,           sub: "Merit List Position" },
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
  const [location, setLocation] = useLocation();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login"),
      onError: () => setLocation("/login"),
    });
  };

  return (
    <div className="flex flex-col h-full gov-gradient select-none">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
            <GraduationCap className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white leading-tight truncate">Allied Health Sciences</p>
            <p className="text-[11px] text-white/50 leading-tight font-medium">Student Portal v1.0</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-bold text-white/40 tracking-widest uppercase">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href} onClick={onClose}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group",
                        isActive
                          ? "bg-white/15 shadow-lg shadow-black/10 backdrop-blur-sm"
                          : "hover:bg-white/8"
                      )}
                    >
                      <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-gold" : "text-white/50 group-hover:text-white/70")} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold leading-tight", isActive ? "text-white" : "text-white/70 group-hover:text-white")}>{item.name}</p>
                        <p className={cn("text-[11px] leading-tight truncate", isActive ? "text-white/50" : "text-white/30")}>{item.sub}</p>
                      </div>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout + Footer */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={() => { handleLogout(); onClose?.(); }}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-all duration-200"
        >
          {logout.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Logout
        </button>
      </div>
      <div className="px-4 py-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/50 font-medium">System Online</span>
          <span className="ml-auto text-[10px] text-white/30">AHS-NMU</span>
        </div>
      </div>
    </div>
  );
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-[270px] shrink-0 hidden md:flex flex-col shadow-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[270px] h-full shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

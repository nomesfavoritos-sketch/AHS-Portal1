import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { TopHeader } from "./top-header";
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  PieChart,
  FileText,
  CreditCard,
  ListOrdered,
  ClipboardList,
  Users,
  Bell,
  History,
  Settings,
  UserCog,
  Loader2,
  BarChart3,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_BG = "#013220";
const ACTIVE_BG = "rgba(22,163,74,0.22)";
const ACTIVE_BORDER = "#16A34A";
const HOVER_BG = "rgba(255,255,255,0.06)";

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admission_admin", "verification_officer", "finance_verifier"],
  },
  {
    name: "Sessions",
    href: "/admin/sessions",
    icon: CalendarDays,
    roles: ["super_admin", "admission_admin"],
  },
  {
    name: "Programs",
    href: "/admin/programs",
    icon: GraduationCap,
    roles: ["super_admin", "admission_admin"],
  },
  {
    name: "Quotas",
    href: "/admin/quotas",
    icon: PieChart,
    roles: ["super_admin", "admission_admin"],
  },
  {
    name: "Applications",
    href: "/admin/applications",
    icon: FileText,
    roles: ["super_admin", "admission_admin", "verification_officer"],
  },
  {
    name: "Payment Verification",
    href: "/admin/challans",
    icon: CreditCard,
    roles: ["super_admin", "finance_verifier"],
  },
  {
    name: "Merit Lists",
    href: "/admin/merit-lists",
    icon: ListOrdered,
    roles: ["super_admin", "admission_admin"],
  },
  {
    name: "Verification Desk",
    href: "/admin/verification",
    icon: ClipboardList,
    roles: ["super_admin", "admission_admin", "verification_officer"],
  },
  {
    name: "Joined Students",
    href: "/admin/students",
    icon: Users,
    roles: ["super_admin", "admission_admin"],
  },
  {
    name: "Notices",
    href: "/admin/notices",
    icon: Bell,
    roles: ["super_admin", "admission_admin"],
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    roles: ["super_admin", "admission_admin"],
  },
  {
    name: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
    roles: ["super_admin"],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: UserCog,
    roles: ["super_admin"],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["super_admin", "admission_admin"],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  admission_admin: "Admission Admin",
  verification_officer: "Verification Officer",
  finance_verifier: "Finance Verifier",
};

function SidebarContent({ user, onClose }: { user: any; onClose?: () => void }) {
  const [location] = useLocation();
  const filteredNav = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{ background: SIDEBAR_BG }}
    >
      {/* Logo / Brand */}
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
              Nishtar Medical University
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/50 hover:text-white ml-1 shrink-0">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Admissions session badge */}
        <div
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.25)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] font-semibold" style={{ color: "#4ade80" }}>
            Admissions 2025–26 Active
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>
          Administration
        </p>
        {filteredNav.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/admin/verification" && location.startsWith(item.href + "/")) ||
            (item.href === "/admin/verification" && location.startsWith("/admin/verification"));

          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group relative"
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
                    style={{ color: isActive ? "#4ade80" : "rgba(255,255,255,0.55)" }}
                  />
                </div>
                <span
                  className="text-[13px] font-medium flex-1"
                  style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)" }}
                >
                  {item.name}
                </span>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#4ade80" }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #006C35, #16A34A)" }}
            >
              {user.fullName?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white truncate leading-tight">
                {user.fullName?.split(" ").slice(0, 2).join(" ") ?? "Admin"}
              </p>
              <p className="text-[10px] truncate leading-tight" style={{ color: "rgba(255,255,255,0.40)" }}>
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user, isLoading } = useGetMe();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img
            src={import.meta.env.BASE_URL + "logo.webp"}
            alt="AHS Logo"
            className="h-12 w-12 rounded-xl object-contain bg-white p-1"
          />
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#01411C" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">

      {/* Desktop Sidebar */}
      <aside className="w-64 h-full shrink-0 hidden md:block" style={{ boxShadow: "2px 0 20px rgba(1,50,32,0.15)" }}>
        <SidebarContent user={user} />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 h-full" style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.3)" }}>
            <SidebarContent user={user} onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main area */}
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
          <span className="text-sm font-bold text-white">Admin Portal</span>
        </div>

        <TopHeader />

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
